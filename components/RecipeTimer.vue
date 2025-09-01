<template>
  <div v-if="timerState.status === 'idle'" class="box-gray flex justify-between items-center">
    <div class="flex items-center space-x-2">
      <ClockIcon class="w-6 h-6" />
      <div class="flex flex-col leading-tight justify-center">
        <span class="font-medium italic">{{ timer.label }}</span>
        <span class="text-sm text-base-content/80">{{ displayTime }}</span>
      </div>
    </div>
    
    <!-- Timer Controls -->
    <div class="flex items-center gap-2">
      <!-- Idle state - Show Start button -->
      <button v-if="timerState.status === 'idle'"
        @click="handleStart"
        class="btn btn-md h-auto py-3 px-4 shadow-none rounded-full font-normal uppercase text-neutral bg-base-100 flex justify-center items-center gap-2">
        <span>start</span>
        <PlayIcon class="w-5 h-5" />
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { PlayIcon } from '@heroicons/vue/20/solid';
import { ClockIcon } from '@heroicons/vue/24/outline';

interface Timer {
  duration: number;
  label: string;
  autoStart?: boolean;
}

interface Props {
  timer: Timer;
  timerId: string;
  stepIndex?: number;
}

const props = defineProps<Props>();
const { formatDuration } = useRecipeUtils();

// Use the provided timer manager or create a new one
const timerManager = inject('timerManager', useTimerManager());
const { getTimer, startTimer, pauseTimer, resetTimer, resumeTimer, timers } = timerManager;

// Initialize timer
const timerState = computed(() => {
  const timer = timers.value.get(props.timerId);
  if (!timer) {
    // Initialize the timer if it doesn't exist
    return getTimer(props.timerId, props.timer.duration, props.timer.label, props.stepIndex);
  }
  return timer;
});

// Display time (either remaining or original duration)
const displayTime = computed(() => {
  if (timerState.value.status === 'idle') {
    return formatDuration(props.timer.duration);
  }
  return formatDuration(timerState.value.remaining);
});

// Button handlers
const handleStart = () => {
  getTimer(props.timerId, props.timer.duration, props.timer.label, props.stepIndex);
  startTimer(props.timerId);
};

// Auto-start if specified
onMounted(() => {
  if (props.timer.autoStart) {
    handleStart();
  }
});
</script>