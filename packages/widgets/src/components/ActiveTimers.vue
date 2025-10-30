<template>
  <div v-if="activeTimers.length > 0"
    class="cs:absolute cs:bottom-[120%] cs:left-0 cs:right-0 cs:mx-auto cs:bg-base-300 cs:rounded-xl cs:border-[0.5px] cs:border-base-300/60 cs:shadow-xl cs:overflow-y-auto cs:max-w-[90%] cs:sm:max-w-lg cs:max-h-[50vh] cs:text-base-content cs:z-40">
    <div>
      <div class="cs:flex cs:items-center cs:justify-end">
        <button v-if="showCloseButton" @click="$emit('close')" class="cs:p-1 cs:cursor-pointer">
          <svg class="cs:w-5 cs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Stack of active timers -->
      <div class="cs:space-y-0 cs:list">
        <div v-for="timer, index in activeTimers" :key="timer.id"
          class="cs:list-row cs:px-3 cs:py-1 cs:rounded-none"
          :class="[ timer.remaining < 60 && timer.remaining > 10 ? 'cs:bg-orange-500 cs:py-3' : '', timer.remaining < 11 && timer.remaining > 0 ? 'cs:bg-red-600 cs:py-3' : '', timer.status === 'alarming' ? 'cs:bg-red-600 cs:animate-pulse cs:py-3' : '', ]"
          >
          <div class="cs:flex cs:list-col-grow cs:items-center cs:space-x-3">
            <svg class="cs:w-5 cs:h-5 cs:text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <div class="cs:font-medium cs:text-sm cs:italic"
              :class="[ timer.remaining < 60 && timer.remaining > 0 ? 'cs:text-red-50' : '' ]"
              >{{ timer.label }}</div>
              <div
              :class="[ timer.remaining < 60 && timer.remaining > 0 ? 'cs:text-2xl cs:font-medium cs:text-red-50 cs:leading-5' : 'cs:text-xs cs:text-base-content/80', timer.status === 'alarming' ? 'cs:text-2xl cs:font-bold cs:text-white cs:animate-pulse' : '', bouncingTimers.has(timer.id) ? 'cs:animate-bounce' : '' ]"
              >
                <span v-if="timer.status === 'alarming'">Timer ended!</span>
                <span v-else>{{ formatDuration(timer.remaining) || 'Complete' }}</span>
                <span v-show="timer.status === 'paused'" class="cs:italic cs:text-xs"> (paused)</span>
              </div>
            </div>
          </div>

          <!-- Timer controls -->
          <div class="cs:flex cs:items-center cs:gap-1">
            <!-- Running - show pause -->
             <template v-if="timer.status === 'running'">
              <div class="cs:join">
                <button @click="addMinute(timer.id)"
                class="cs:cursor-pointer cs:join-item cs:py-1.5 cs:px-3 cs:rounded-l-full cs:bg-base-100 cs:border cs:border-base-300 cs:hover:bg-green-700/70 cs:hover:text-green-50 cs:text-xs cs:font-bold">
                +1m
              </button>
              <button @click="pauseTimer(timer.id)"
              class="cs:cursor-pointer cs:join-item cs:py-1.5 cs:px-3 cs:rounded-r-full cs:bg-base-100 cs:border cs:border-base-300 cs:hover:bg-amber-400/70 cs:hover:text-amber-800">
              <PauseIcon class="cs:w-5 cs:h-5" />
            </button>
              </div>
             </template>
            

            <!-- Paused - show reset, +1m, and resume -->
            <template v-else-if="timer.status === 'paused'">
              <div class="cs:join">
              <button @click="resetTimer(timer.id)"
                class="cs:cursor-pointer cs:join-item cs:py-1.5 cs:px-3 cs:rounded-l-full cs:bg-base-100 cs:border cs:border-base-300 cs:hover:bg-red-700/70 cs:hover:text-red-50">
                <TrashIcon class="cs:w-5 cs:h-5" />
              </button>
              <button @click="addMinute(timer.id)"
                class="cs:cursor-pointer cs:join-item cs:py-1.5 cs:px-3 cs:bg-base-100 cs:border cs:border-base-300 cs:hover:bg-green-700/70 cs:hover:text-green-50 cs:text-xs cs:font-bold">
                +1m
              </button>
              <button @click="resumeTimer(timer.id)"
                class="cs:cursor-pointer cs:join-item cs:py-1.5 cs:px-3 cs:rounded-r-full cs:bg-base-100 cs:border cs:border-base-300 cs:hover:bg-primary cs:hover:text-primary-content">
                <PlayIcon class="cs:w-5 cs:h-5" />
              </button>
              </div>
            </template>

            <!-- Alarming - show stop alarm button prominently -->
            <template v-else-if="timer.status === 'alarming'">
              <button @click="stopAlarm(timer.id)"
                class="cs:cursor-pointer cs:py-2 cs:px-4 cs:rounded-full cs:bg-white cs:text-red-600 cs:font-bold cs:animate-pulse cs:hover:bg-red-100">
                STOP
              </button>
            </template>

            <!-- Completed - show checkmark and reset -->
            <template v-else-if="timer.status === 'completed'">
              <span class="cs:text-emerald-500 cs:pr-2.5">
                <CheckIcon class="cs:w-5 cs:h-5" />
              </span>
              <button @click="resetTimer(timer.id)"
                class="cs:cursor-pointer cs:py-1.5 cs:px-3 cs:rounded-full cs:bg-base-100 cs:border cs:border-base-300 cs:hover:bg-red-700/70 cs:hover:text-red-50">
                <TrashIcon class="cs:w-5 cs:h-5" />
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch } from 'vue'
import { CheckIcon, PlayIcon } from '@heroicons/vue/20/solid';
import { PauseIcon, TrashIcon } from '@heroicons/vue/24/outline';
import { useRecipeUtils } from '../composables/useRecipeUtils'

interface Timer {
  id: string;
  label: string;
  remaining: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'alarming';
  duration: number;
  stepIndex?: number;
}

interface Props {
  showCloseButton?: boolean;
}

withDefaults(defineProps<Props>(), {
  showCloseButton: false
});

defineEmits<{
  close: [];
}>();

const { formatDuration } = useRecipeUtils();

// Bounce animation state
const bouncingTimers = ref<Set<string>>(new Set());

// Get timer manager from injection (must be provided from parent)
const timerManager = inject<any>('timerManager');
if (!timerManager) {
  throw new Error('Timer manager not provided. Make sure to provide timerManager from parent component.');
}
const { timers, pauseTimer: pause, resetTimer: reset, resumeTimer: resume, addMinute: addMin, stopAlarm } = timerManager;

// Inject analytics
const analytics = inject<any>('analytics');

// Computed list of active timers (running, paused, completed, or alarming)
const activeTimers = computed<Timer[]>(() => {
  const active = Array.from(timers.value.values() as IterableIterator<Timer>).filter((timer) =>
    timer.status === 'running' || timer.status === 'paused' || timer.status === 'completed' || timer.status === 'alarming'
  );
  return active;
});

// Track timer completions
const trackedCompletions = ref<Set<string>>(new Set());
watch(activeTimers, (newTimers) => {
  newTimers.forEach(timer => {
    if ((timer.status === 'completed' || timer.status === 'alarming') && !trackedCompletions.value.has(timer.id)) {
      // Track timer completion in analytics
      if (analytics) {
        analytics.trackTimerEvent('complete', timer.id);
      }
      trackedCompletions.value.add(timer.id);
    }
  });
}, { deep: true });

// Timer control methods
const pauseTimer = (id: string) => pause(id);
const resetTimer = (id: string) => {
  // Track timer stop in analytics
  if (analytics) {
    analytics.trackTimerEvent('stop', id);
  }
  reset(id);
};
const resumeTimer = (id: string) => resume(id);
const addMinute = (id: string) => {
  addMin(id);
  
  // Trigger bounce animation
  bouncingTimers.value.add(id);
  
  // Remove bounce animation after animation completes (~0.5s)
  setTimeout(() => {
    bouncingTimers.value.delete(id);
    bouncingTimers.value = new Set(bouncingTimers.value);
  }, 2500);
};
</script>