interface Timer {
  id: string;
  duration: number;
  label: string;
  remaining: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  intervalId?: NodeJS.Timeout;
}

export const useTimerManager = () => {
  const timers = ref<Map<string, Timer>>(new Map());
  const audioContext = ref<AudioContext | null>(null);
  const hasActiveTimers = ref(false);

  // Initialize audio context on first user interaction
  const initAudio = () => {
    if (!audioContext.value && typeof window !== 'undefined') {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  const getTimer = (id: string, duration: number, label: string): Timer => {
    if (timers.value.has(id)) {
      return timers.value.get(id)!;
    }
    
    const timer: Timer = {
      id,
      duration,
      label,
      remaining: duration,
      status: 'idle'
    };
    
    timers.value.set(id, timer);
    return timer;
  };

  // Start a timer
  const startTimer = (id: string) => {
    initAudio(); // Initialize audio on user interaction
    const timer = timers.value.get(id);
    if (!timer || timer.status === 'running') return;
    
    if (timer.status === 'completed') {
      timer.remaining = timer.duration;
    }
    
    timer.status = 'running';
    
    timer.intervalId = setInterval(() => {
      const currentTimer = timers.value.get(id);
      if (!currentTimer) return;
      
      currentTimer.remaining--;
      
      if (currentTimer.remaining <= 0) {
        currentTimer.remaining = 0;
        currentTimer.status = 'completed';
        clearInterval(currentTimer.intervalId);
        delete currentTimer.intervalId;
        playAlarm();
      }
      
      // Force reactivity update
      timers.value = new Map(timers.value);
    }, 1000);
    
    // Force reactivity update
    timers.value = new Map(timers.value);
    updateActiveTimersStatus();
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
    
    // Force reactivity update
    timers.value = new Map(timers.value);
    updateActiveTimersStatus();
  };

  // Resume a paused timer
  const resumeTimer = (id: string) => {
    const timer = timers.value.get(id);
    if (!timer || timer.status !== 'paused') return;
    
    startTimer(id);
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

  // Clean up on unmount
  onUnmounted(() => {
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
    cleanup
  };
};