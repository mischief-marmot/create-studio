<template>
  <div v-if="timerState.status === 'idle'" class="box-gray cs:flex cs:justify-between cs:items-center">
    <div class="cs:flex cs:items-center cs:space-x-2">
      <ClockIcon class="cs:w-6 cs:h-6" />
      <div class="cs:flex cs:flex-col cs:leading-tight cs:justify-center">
        <span class="cs:font-medium cs:italic">{{ timer.label }}</span>
        <span class="cs:text-sm cs:text-base-content/80">{{ displayTime }}</span>
      </div>
    </div>
    
    <!-- Timer Controls -->
    <div class="cs:flex cs:items-center cs:gap-2">
      <!-- Idle state - Show Start button -->
      <button v-if="timerState.status === 'idle'"
        @click="handleStartClick"
        class="cs:btn cs:btn-md cs:h-auto cs:py-3 cs:px-4 cs:shadow-none cs:rounded-full cs:font-normal cs:uppercase cs:text-base-content cs:bg-base-100 cs:flex cs:justify-center cs:items-center cs:gap-2">
        <span>start</span>
        <PlayIcon class="cs:w-5 cs:h-5" />
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { PlayIcon } from '@heroicons/vue/20/solid';
import { ClockIcon } from '@heroicons/vue/24/outline';
import { useRecipeUtils } from '../composables/useRecipeUtils'

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

// Use the provided timer manager (must be provided from parent)
const timerManager = inject<any>('timerManager');
if (!timerManager) {
  throw new Error('Timer manager not provided. Make sure to provide timerManager from parent component.');
}
const { getTimer, startTimer, timers } = timerManager;

// Inject timer warning request function
const requestTimerWarning = inject<any>('requestTimerWarning');

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
const handleStartClick = () => {
  console.log('🚀 [RecipeTimer] handleStartClick called');

  // Request timer warning (shows modal in InteractiveExperience on first timer)
  if (requestTimerWarning) {
    requestTimerWarning(() => {
      handleStart();
    });
  } else {
    // Fallback if requestTimerWarning not provided
    handleStart();
  }
};

const handleStart = () => {
  console.log('🚀 [RecipeTimer] handleStart called for timer:', props.timerId);

  // Start the timer
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