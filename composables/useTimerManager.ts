import { useRecipeInteractionStore } from '~/stores/recipeInteraction'

interface Timer {
  id: string;
  duration: number;
  label: string;
  remaining: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  intervalId?: NodeJS.Timeout;
  stepIndex?: number;
}

export const useTimerManager = () => {
  const recipeStore = useRecipeInteractionStore();
  const timers = ref<Map<string, Timer>>(new Map());
  const audioContext = ref<AudioContext | null>(null);
  const hasActiveTimers = ref(false);

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

  // Play alarm sound using Web Audio API
  const playAlarm = () => {
    initAudio();
    if (!audioContext.value) return;

    const oscillator = audioContext.value.createOscillator();
    const gainNode = audioContext.value.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.value.destination);
    
    // Create a pleasant alarm sound
    oscillator.frequency.value = 880; // A5 note
    oscillator.type = 'sine';
    
    // Fade in and out
    gainNode.gain.setValueAtTime(0, audioContext.value.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.value.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.value.currentTime + 0.5);
    
    oscillator.start(audioContext.value.currentTime);
    oscillator.stop(audioContext.value.currentTime + 0.5);
    
    // Play three beeps
    setTimeout(() => {
      const osc2 = audioContext.value!.createOscillator();
      const gain2 = audioContext.value!.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.value!.destination);
      osc2.frequency.value = 880;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0, audioContext.value!.currentTime);
      gain2.gain.linearRampToValueAtTime(0.3, audioContext.value!.currentTime + 0.1);
      gain2.gain.linearRampToValueAtTime(0, audioContext.value!.currentTime + 0.5);
      osc2.start(audioContext.value!.currentTime);
      osc2.stop(audioContext.value!.currentTime + 0.5);
    }, 600);
    
    setTimeout(() => {
      const osc3 = audioContext.value!.createOscillator();
      const gain3 = audioContext.value!.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.value!.destination);
      osc3.frequency.value = 880;
      osc3.type = 'sine';
      gain3.gain.setValueAtTime(0, audioContext.value!.currentTime);
      gain3.gain.linearRampToValueAtTime(0.3, audioContext.value!.currentTime + 0.1);
      gain3.gain.linearRampToValueAtTime(0, audioContext.value!.currentTime + 0.5);
      osc3.start(audioContext.value!.currentTime);
      osc3.stop(audioContext.value!.currentTime + 0.5);
    }, 1200);
  };

  // Create or get a timer
  const getTimer = (id: string, duration: number, label: string, stepIndex?: number): Timer => {
    if (timers.value.has(id)) {
      return timers.value.get(id)!;
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
    
    // Sync with recipe store - only if not already there and we're on client side
    if (import.meta.client && recipeStore.currentProgress) {
      const existingStoreTimer = recipeStore.currentProgress.activeTimers.find(t => t.id === id);
      if (!existingStoreTimer) {
        const newTimer = recipeStore.addTimer({
          id,
          label,
          duration,
          remaining: duration,
          isActive: false,
          stepIndex
        });
      }
    }
    
    return timer;
  };

  // Start a timer
  const startTimer = async (id: string) => {
    await initAudio(); // Initialize audio on user interaction
    const timer = timers.value.get(id);
    if (!timer || timer.status === 'running') return;
    
    if (timer.status === 'completed') {
      timer.remaining = timer.duration;
    }
    
    timer.status = 'running';
    
    // Update store (ensure timer exists first)
    if (recipeStore.currentProgress) {
      // Make sure timer exists in store first
      const existingTimer = recipeStore.currentProgress.activeTimers.find(t => t.id === id);
      if (!existingTimer) {
        recipeStore.addTimer({
          id,
          label: timer.label,
          duration: timer.duration,
          remaining: timer.remaining,
          isActive: true,
          stepIndex: timer.stepIndex
        });
      } else {
        recipeStore.updateTimer(id, {
          remaining: timer.remaining,
          isActive: true
        });
      }
    }
    
    // Start the interval synced to second boundaries for visual consistency
    const now = Date.now();
    const msToNextSecond = 1000 - (now % 1000);
    
    setTimeout(() => {
      timer.intervalId = setInterval(() => {
        const currentTimer = timers.value.get(id);
        if (!currentTimer) return;
        
        currentTimer.remaining--;
        
        // Update store with remaining time (throttle to every 10 seconds to reduce localStorage writes)
        if (recipeStore.currentProgress && currentTimer.remaining % 10 === 0) {
          recipeStore.updateTimer(id, {
            remaining: currentTimer.remaining
          });
        }
        
        if (currentTimer.remaining <= 0) {
          currentTimer.remaining = 0;
          currentTimer.status = 'completed';
          clearInterval(currentTimer.intervalId);
          delete currentTimer.intervalId;
          
          // Update store
          if (recipeStore.currentProgress) {
            recipeStore.updateTimer(id, {
              remaining: 0,
              isActive: false
            });
          }
          
          playAlarm();
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
  const pauseTimer = (id: string) => {
    const timer = timers.value.get(id);
    if (!timer || timer.status !== 'running') return;
    
    timer.status = 'paused';
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      delete timer.intervalId;
    }
    
    // Update store
    if (recipeStore.currentProgress) {
      recipeStore.updateTimer(id, {
        isActive: false,
        remaining: timer.remaining
      });
    }
    
    // Force reactivity update
    timers.value = new Map(timers.value);
    updateActiveTimersStatus();
  };

  // Reset a timer
  const resetTimer = (id: string) => {
    const timer = timers.value.get(id);
    if (!timer) return;
    
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      delete timer.intervalId;
    }
    
    timer.remaining = timer.duration;
    timer.status = 'idle';
    
    // Update store
    if (recipeStore.currentProgress) {
      recipeStore.updateTimer(id, {
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
    timer.status = 'running';
    
    // Update store
    if (recipeStore.currentProgress) {
      recipeStore.updateTimer(id, {
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
        
        // Update store with remaining time (throttle to every 10 seconds to reduce localStorage writes)
        if (recipeStore.currentProgress && currentTimer.remaining % 10 === 0) {
          recipeStore.updateTimer(id, {
            remaining: currentTimer.remaining
          });
        }
        
        if (currentTimer.remaining <= 0) {
          currentTimer.remaining = 0;
          currentTimer.status = 'completed';
          clearInterval(currentTimer.intervalId);
          delete currentTimer.intervalId;
          
          // Update store
          if (recipeStore.currentProgress) {
            recipeStore.updateTimer(id, {
              remaining: 0,
              isActive: false
            });
          }
          
          playAlarm();
        }
        
        // Force reactivity update
        timers.value = new Map(timers.value);
      }, 1000);
      
      // Force reactivity update
      timers.value = new Map(timers.value);
      updateActiveTimersStatus();
    }, msToNextSecond);
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
      timer.status === 'running' || timer.status === 'paused' || timer.status === 'completed'
    ).length;
    hasActiveTimers.value = activeCount > 0;
  };

  // Clean up all timers
  const cleanup = () => {
    timers.value.forEach(timer => {
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
      }
    });
    timers.value.clear();
  };

  // Restore timers from store
  const restoreTimersFromStore = () => {
    if (!recipeStore.currentProgress) {
      return;
    }
    
    const storeTimers = recipeStore.currentProgress.activeTimers;
    
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
      
      // If timer was active, restart it without going through startTimer to avoid double-updating store
      if (storeTimer.isActive && storeTimer.remaining > 0) {
        timer.status = 'running';
        
        // Start the interval immediately on next tick to sync with second boundaries
        const now = Date.now();
        const msToNextSecond = 1000 - (now % 1000);
        
        setTimeout(() => {
          timer.intervalId = setInterval(() => {
            const currentTimer = timers.value.get(storeTimer.id);
            if (!currentTimer) return;
            
            currentTimer.remaining--;
            
            // Update store with remaining time (throttle to every 10 seconds to reduce localStorage writes)
            if (recipeStore.currentProgress && currentTimer.remaining % 10 === 0) {
              recipeStore.updateTimer(storeTimer.id, {
                remaining: currentTimer.remaining
              });
            }
            
            if (currentTimer.remaining <= 0) {
              currentTimer.remaining = 0;
              currentTimer.status = 'completed';
              clearInterval(currentTimer.intervalId);
              delete currentTimer.intervalId;
              
              // Update store
              if (recipeStore.currentProgress) {
                recipeStore.updateTimer(storeTimer.id, {
                  remaining: 0,
                  isActive: false
                });
              }
              
              playAlarm();
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
    if (!recipeStore.currentProgress) return;
    
    timers.value.forEach((timer) => {
      // Force update all timers to store before unload
      recipeStore.updateTimer(timer.id, {
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
    getTimerStatus,
    getRemainingTime,
    updateActiveTimersStatus,
    cleanup,
    restoreTimersFromStore
  };
};