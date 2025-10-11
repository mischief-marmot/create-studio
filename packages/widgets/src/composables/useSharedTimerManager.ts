import { ref, computed, onUnmounted, readonly } from 'vue'
import { SharedStorageManager } from '@create-studio/shared/lib/shared-storage/shared-storage-manager'
import { useServerTimerSync } from './useServerTimerSync'
import { getUserId } from '../utils/userId'

interface Timer {
  id: string;
  duration: number;
  label: string;
  remaining: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'alarming';
  intervalId?: NodeJS.Timeout;
  stepIndex?: number;
  alarmAudio?: HTMLAudioElement;
  creationId?: string;
}

interface TimerManagerOptions {
  storageManager: SharedStorageManager | null;
  baseUrl?: string;
  creationId?: string;
  useServerSync?: boolean;
}

export const useSharedTimerManager = (options: TimerManagerOptions | SharedStorageManager | null) => {
  // Handle backward compatibility - if passed SharedStorageManager directly, wrap it
  const config = options instanceof SharedStorageManager || options === null
    ? { storageManager: options, useServerSync: false }
    : { useServerSync: true, ...options }

  const storageManager = config.storageManager;
  const timers = ref<Map<string, Timer>>(new Map());
  const audioContext = ref<AudioContext | null>(null);
  const hasActiveTimers = ref(false);
  const alarmAudioElements = ref<Map<string, HTMLAudioElement>>(new Map());

  // Initialize server sync if enabled
  const serverSync = config.useServerSync && config.baseUrl
    ? useServerTimerSync(getUserId(), config.baseUrl)
    : null;

  // Set up server sync callbacks
  if (serverSync) {
    console.log('[TimerManager] Server sync enabled');

    // Handle timer updates from server
    serverSync.onTimerUpdate.value = (serverTimers) => {
      serverTimers.forEach((serverTimer) => {
        const localTimer = timers.value.get(serverTimer.id);

        if (localTimer) {
          // Update existing timer with server state (but preserve local duration)
          // Only update remaining and status from server, keep local duration
          localTimer.remaining = serverTimer.remaining;
          localTimer.status = serverTimer.status === 'completed' ? 'alarming' : serverTimer.status;

          // Trigger alarm if completed
          if (serverTimer.status === 'completed' && localTimer.status !== 'completed') {
            showNotification(serverTimer.id);
            playAlarm(serverTimer.id);
          }
        } else if (serverTimer.status !== 'completed') {
          // Restore timer that exists on server but not locally
          console.log('[TimerManager] Restoring timer from server:', serverTimer.id);
          timers.value.set(serverTimer.id, {
            id: serverTimer.id,
            duration: serverTimer.remaining, // We don't have original duration, use remaining
            label: 'Restored Timer',
            remaining: serverTimer.remaining,
            status: serverTimer.status,
            creationId: config.creationId
          });
        }
      });

      // Force reactivity update
      timers.value = new Map(timers.value);
      updateActiveTimersStatus();
    };

    // Handle timer completion from server
    serverSync.onTimerComplete.value = (timerId) => {
      console.log('[TimerManager] Timer completed on server:', timerId);
      const timer = timers.value.get(timerId);
      if (timer) {
        showNotification(timerId);
        playAlarm(timerId);
      }
    };

    // Connect to server
    serverSync.connect();
  }

  // Show notification when timer completes
  const showNotification = (timerId: string) => {
    console.log('[TimerManager] 🔔 showNotification called for:', timerId);
    const timer = timers.value.get(timerId);
    if (!timer) {
      console.warn('[TimerManager] ⚠️  Timer not found for notification:', timerId);
      return;
    }

    const hasNotificationSupport = 'Notification' in window;
    const permission = hasNotificationSupport ? Notification.permission : 'not-supported';
    console.log('[TimerManager] 📱 Notification permission:', permission);

    // Check if notifications are supported and permitted
    if (hasNotificationSupport && Notification.permission === 'granted') {
      try {
        console.log('[TimerManager] ✅ Creating notification for:', timer.label);
        const notification = new Notification('Timer Complete!', {
          body: timer.label || 'Your timer has finished',
          icon: config.baseUrl ? `${config.baseUrl}/img/icon.svg` : undefined,
          tag: timerId, // Prevents duplicate notifications
          requireInteraction: true, // Keeps notification visible until user interacts
          vibrate: [200, 100, 200], // Vibration pattern for mobile
          silent: false // Ensure notification plays sound
        });

        console.log('[TimerManager] ✅ Notification created successfully');

        notification.onclick = () => {
          console.log('[TimerManager] 👆 Notification clicked');
          window.focus(); // Bring browser to front
          notification.close();
          stopAlarm(timerId); // Stop the alarm when user clicks notification
        };
      } catch (error) {
        console.error('[TimerManager] ❌ Failed to show notification:', error);
      }
    } else {
      console.warn('[TimerManager] ⚠️  Notifications not available. Support:', hasNotificationSupport, 'Permission:', permission);
    }
  };

  // Initialize audio context on first user interaction
  const initAudio = async () => {
    if (!audioContext.value && typeof window !== 'undefined') {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume audio context if it's in suspended state (required by modern browsers)
      if (audioContext.value.state === 'suspended') {
        try {
          await audioContext.value.resume();
        } catch (error) {
          console.warn('Failed to resume audio context:', error);
        }
      }
    }
  };

  // Play alarm sound using custom audio file
  const playAlarm = (timerId: string) => {
    const timer = timers.value.get(timerId);
    if (!timer) return;

    // Create audio element if it doesn't exist
    if (!timer.alarmAudio) {
      // Use the baseUrl from config if available, otherwise fallback to current origin
      const audioBaseUrl = config.baseUrl || window.location.origin;

      timer.alarmAudio = new Audio(`${audioBaseUrl}/audio/timer.mp3`);
      timer.alarmAudio.loop = true; // Enable looping
      timer.alarmAudio.volume = 0.7;
      alarmAudioElements.value.set(timerId, timer.alarmAudio);
    }

    // Play the alarm
    timer.alarmAudio.play().catch(error => {
      console.warn('Failed to play alarm audio:', error);
      // Fallback to the original beep sound if custom audio fails
      playFallbackAlarm();
    });
  };

  // Stop the alarm for a specific timer
  const stopAlarm = (timerId: string) => {
    const timer = timers.value.get(timerId);
    if (!timer || !timer.alarmAudio) return;

    timer.alarmAudio.pause();
    timer.alarmAudio.currentTime = 0;
    timer.status = 'completed';

    // Remove completed timer from storage
    if (storageManager) {
      storageManager.removeTimer(timerId);
    }

    // Remove from server
    if (serverSync) {
      serverSync.deleteTimer(timerId).catch(error => {
        console.error('[TimerManager] Failed to delete timer from server:', error);
      });
    }

    // Remove from in-memory timers map
    timers.value.delete(timerId);

    // Force reactivity update
    timers.value = new Map(timers.value);
    updateActiveTimersStatus();
  };

  // Fallback alarm using Web Audio API (original implementation)
  const playFallbackAlarm = () => {
    initAudio();
    if (!audioContext.value) return;

    const oscillator = audioContext.value.createOscillator();
    const gainNode = audioContext.value.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.value.destination);
    
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.value.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.value.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.value.currentTime + 0.5);
    
    oscillator.start(audioContext.value.currentTime);
    oscillator.stop(audioContext.value.currentTime + 0.5);
  };

  // Create or get a timer
  const getTimer = (id: string, duration: number, label: string, stepIndex?: number): Timer => {
    const existingTimer = timers.value.get(id);

    if (existingTimer) {
      // If duration or label changed in recipe, update the timer (but only if idle)
      if (existingTimer.status === 'idle') {
        if (existingTimer.duration !== duration) {
          console.log(`[TimerManager] Updating timer ${id} duration: ${existingTimer.duration}s -> ${duration}s`);
          existingTimer.duration = duration;
          existingTimer.remaining = duration;
        }
        if (existingTimer.label !== label) {
          existingTimer.label = label;
        }
      }
      return existingTimer;
    }

    const timer: Timer = {
      id,
      duration,
      label,
      remaining: duration,
      status: 'idle',
      stepIndex
    };

    timers.value.set(id, timer);

    // Sync with shared storage - only if not already there and we're on client side
    if (import.meta.client && storageManager) {
      const currentState = storageManager.getCurrentCreationState();
      if (currentState) {
        const existingStoreTimer = currentState.activeTimers.find(t => t.id === id);
        if (!existingStoreTimer) {
          storageManager.addTimer({
            id,
            label,
            duration,
            remaining: duration,
            isActive: false,
            stepIndex
          });
        }
      }
    }

    return timer;
  };

  // Start a timer
  const startTimer = async (id: string) => {
    console.log('⏱️  [Timer Manager] startTimer called for:', id);
    await initAudio(); // Initialize audio on user interaction
    const timer = timers.value.get(id);
    if (!timer || timer.status === 'running') {
      console.log('⏱️  [Timer Manager] Timer not found or already running');
      return;
    }
    console.log('⏱️  [Timer Manager] Timer found, starting...');

    // Ensure any existing interval is cleared before creating new one
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = undefined;
    }

    if (timer.status === 'completed') {
      timer.remaining = timer.duration;
    }

    timer.status = 'running';

    // Sync with server if enabled
    if (serverSync) {
      try {
        console.log('[TimerManager] Starting timer on server:', id);
        await serverSync.startTimer({
          id,
          creationId: timer.creationId || config.creationId || 'unknown',
          duration: timer.duration,
          label: timer.label,
          remaining: timer.remaining,
          stepIndex: timer.stepIndex
        });
      } catch (error) {
        console.error('[TimerManager] Failed to sync timer with server:', error);
        // Continue with local timer even if server sync fails
      }
    }

    // Update storage (ensure timer exists first)
    if (storageManager) {
      const currentState = storageManager.getCurrentCreationState();
      if (currentState) {
        // Make sure timer exists in storage first
        const existingTimer = currentState.activeTimers.find(t => t.id === id);
        if (!existingTimer) {
          storageManager.addTimer({
            id,
            label: timer.label,
            duration: timer.duration,
            remaining: timer.remaining,
            isActive: true,
            stepIndex: timer.stepIndex
          });
        } else {
          storageManager.updateTimer(id, {
            remaining: timer.remaining,
            isActive: true
          });
        }
      }
    }

    // Timer is now managed by server sync (if enabled)

    // Start the interval synced to second boundaries for visual consistency
    const now = Date.now();
    const msToNextSecond = 1000 - (now % 1000);
    
    setTimeout(() => {
      timer.intervalId = setInterval(() => {
        const currentTimer = timers.value.get(id);
        if (!currentTimer) return;
        
        currentTimer.remaining--;
        
        // Update storage with remaining time (throttle to every 10 seconds to reduce localStorage writes)
        if (storageManager && currentTimer.remaining % 10 === 0) {
          storageManager.updateTimer(id, {
            remaining: currentTimer.remaining
          });
        }
        
        if (currentTimer.remaining <= 0) {
          currentTimer.remaining = 0;
          currentTimer.status = 'alarming';
          clearInterval(currentTimer.intervalId);
          delete currentTimer.intervalId;

          // Update storage
          if (storageManager) {
            storageManager.updateTimer(id, {
              remaining: 0,
              isActive: false
            });
          }

          showNotification(id);
          playAlarm(id);
        }
        
        // Force reactivity update
        timers.value = new Map(timers.value);
      }, 1000);
      
      // Force reactivity update
      timers.value = new Map(timers.value);
      updateActiveTimersStatus();
    }, msToNextSecond);
  };

  // Pause a timer
  const pauseTimer = async (id: string) => {
    const timer = timers.value.get(id);
    if (!timer || timer.status !== 'running') return;

    timer.status = 'paused';

    // Ensure all intervals for this timer are cleared
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = undefined;
    }

    // Sync with server if enabled
    if (serverSync) {
      try {
        await serverSync.pauseTimer(id, timer.remaining);
      } catch (error) {
        console.error('[TimerManager] Failed to pause timer on server:', error);
      }
    }

    // Update storage
    if (storageManager) {
      storageManager.updateTimer(id, {
        isActive: false,
        remaining: timer.remaining
      });
    }

    // Force reactivity update
    timers.value = new Map(timers.value);
    updateActiveTimersStatus();
  };

  // Reset a timer
  const resetTimer = async (id: string) => {
    const timer = timers.value.get(id);
    if (!timer) return;

    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      delete timer.intervalId;
    }

    timer.remaining = timer.duration;
    timer.status = 'idle';

    // Update storage
    if (storageManager) {
      storageManager.updateTimer(id, {
        remaining: timer.duration,
        isActive: false
      });
    }

    // Force reactivity update
    timers.value = new Map(timers.value);
    updateActiveTimersStatus();
  };

  // Resume a paused timer
  const resumeTimer = async (id: string) => {
    const timer = timers.value.get(id);
    if (!timer || timer.status !== 'paused') return;

    await initAudio(); // Initialize audio on user interaction

    // Ensure any existing interval is cleared before creating new one
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = undefined;
    }

    timer.status = 'running';

    // Update storage
    if (storageManager) {
      storageManager.updateTimer(id, {
        remaining: timer.remaining,
        isActive: true
      });
    }

    // Start the interval synced to second boundaries for visual consistency
    const now = Date.now();
    const msToNextSecond = 1000 - (now % 1000);
    
    setTimeout(() => {
      timer.intervalId = setInterval(() => {
        const currentTimer = timers.value.get(id);
        if (!currentTimer) return;
        
        currentTimer.remaining--;
        
        // Update storage with remaining time (throttle to every 10 seconds to reduce localStorage writes)
        if (storageManager && currentTimer.remaining % 10 === 0) {
          storageManager.updateTimer(id, {
            remaining: currentTimer.remaining
          });
        }
        
        if (currentTimer.remaining <= 0) {
          currentTimer.remaining = 0;
          currentTimer.status = 'alarming';
          clearInterval(currentTimer.intervalId);
          delete currentTimer.intervalId;

          // Update storage
          if (storageManager) {
            storageManager.updateTimer(id, {
              remaining: 0,
              isActive: false
            });
          }

          showNotification(id);
          playAlarm(id);
        }
        
        // Force reactivity update
        timers.value = new Map(timers.value);
      }, 1000);
      
      // Force reactivity update
      timers.value = new Map(timers.value);
      updateActiveTimersStatus();
    }, msToNextSecond);
  };

  // Add a minute to a paused timer
  const addMinute = (id: string) => {
    const timer = timers.value.get(id);
    if (!timer) return;
    
    // Add 60 seconds to remaining time
    timer.remaining += 60;
    
    // Update storage
    if (storageManager) {
      storageManager.updateTimer(id, {
        remaining: timer.remaining
      });
    }
    
    // Force reactivity update
    timers.value = new Map(timers.value);
  };

  // Get timer status
  const getTimerStatus = (id: string) => {
    const timer = timers.value.get(id);
    return timer ? timer.status : 'idle';
  };

  // Get remaining time
  const getRemainingTime = (id: string) => {
    const timer = timers.value.get(id);
    return timer ? timer.remaining : 0;
  };

  // Update hasActiveTimers whenever timers change
  const updateActiveTimersStatus = () => {
    const activeCount = Array.from(timers.value.values()).filter(timer =>
      timer.status === 'running' || timer.status === 'paused' || timer.status === 'completed' || timer.status === 'alarming'
    ).length;
    hasActiveTimers.value = activeCount > 0;
  };

  // Service Worker listeners removed - using server sync instead

  // Clean up all timers
  const cleanup = () => {
    timers.value.forEach(timer => {
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
      }
      if (timer.alarmAudio) {
        timer.alarmAudio.pause();
        timer.alarmAudio = undefined;
      }
    });
    alarmAudioElements.value.forEach(audio => {
      audio.pause();
    });
    alarmAudioElements.value.clear();
    timers.value.clear();
  };

  // Restore timers from storage
  const restoreTimersFromStore = () => {
    if (!storageManager) {
      return;
    }
    
    const currentState = storageManager.getCurrentCreationState();
    if (!currentState) {
      return;
    }
    
    const storeTimers = currentState.activeTimers;
    
    storeTimers.forEach(storeTimer => {
      const timer: Timer = {
        id: storeTimer.id,
        duration: storeTimer.duration,
        label: storeTimer.label,
        remaining: storeTimer.remaining,
        status: storeTimer.isActive ? 'running' : 
                storeTimer.remaining === 0 ? 'completed' : 
                storeTimer.remaining < storeTimer.duration ? 'paused' : 'idle',
        stepIndex: storeTimer.stepIndex
      };
      
      timers.value.set(storeTimer.id, timer);
      
      // If timer was active, restart it without going through startTimer to avoid double-updating storage
      if (storeTimer.isActive && storeTimer.remaining > 0) {
        // Ensure no existing interval before creating new one
        if (timer.intervalId) {
          clearInterval(timer.intervalId);
          timer.intervalId = undefined;
        }
        
        timer.status = 'running';
        
        // Start the interval immediately on next tick to sync with second boundaries
        const now = Date.now();
        const msToNextSecond = 1000 - (now % 1000);
        
        setTimeout(() => {
          timer.intervalId = setInterval(() => {
            const currentTimer = timers.value.get(storeTimer.id);
            if (!currentTimer) return;
            
            currentTimer.remaining--;
            
            // Update storage with remaining time (throttle to every 10 seconds to reduce localStorage writes)
            if (storageManager && currentTimer.remaining % 10 === 0) {
              storageManager.updateTimer(storeTimer.id, {
                remaining: currentTimer.remaining
              });
            }
            
            if (currentTimer.remaining <= 0) {
              currentTimer.remaining = 0;
              currentTimer.status = 'alarming';
              clearInterval(currentTimer.intervalId);
              delete currentTimer.intervalId;
              
              // Update storage
              if (storageManager) {
                storageManager.updateTimer(storeTimer.id, {
                  remaining: 0,
                  isActive: false
                });
              }
              
              playAlarm(storeTimer.id);
            }
            
            // Force reactivity update
            timers.value = new Map(timers.value);
          }, 1000);
          
          // Force reactivity update
          timers.value = new Map(timers.value);
          updateActiveTimersStatus();
        }, msToNextSecond);
      }
    });
    
    updateActiveTimersStatus();
  };

  // Save all timer states before page unload/refresh
  const saveTimersOnUnload = () => {
    if (!storageManager) return;
    
    timers.value.forEach((timer) => {
      // Force update all timers to storage before unload
      storageManager.updateTimer(timer.id, {
        remaining: timer.remaining,
        isActive: timer.status === 'running'
      });
    });
  };

  // Set up beforeunload listener on client side
  if (import.meta.client && typeof window !== 'undefined') {
    window.addEventListener('beforeunload', saveTimersOnUnload);
  }

  // Clean up on unmount
  onUnmounted(() => {
    if (import.meta.client && typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', saveTimersOnUnload);
    }
    cleanup();
  });

  return {
    timers: readonly(timers),
    hasActiveTimers: readonly(hasActiveTimers),
    getTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    resumeTimer,
    addMinute,
    stopAlarm,
    getTimerStatus,
    getRemainingTime,
    updateActiveTimersStatus,
    cleanup,
    restoreTimersFromStore
  };
};