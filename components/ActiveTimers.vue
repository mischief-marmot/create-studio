<template>
  <div v-if="activeTimers.length > 0"
    class="absolute bottom-[120%] left-0 right-0 mx-auto bg-base-300 rounded-xl border-[0.5px] border-base-300/60 shadow-xl overflow-y-auto max-w-[90%] max-h-[50vh] text-base-content z-40">
    <div>
      <div class="flex items-center justify-end">
        <button v-if="showCloseButton" @click="$emit('close')" class="p-1 cursor-pointer">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Stack of active timers -->
      <div class="space-y-0 list">
        <div v-for="timer, index in activeTimers" :key="timer.id"
          class="list-row px-3 py-1 rounded-none"
          :class="[
            timer.remaining < 60 && timer.remaining > 10 ? 'bg-orange-500 py-3' : '',
            timer.remaining < 11 && timer.remaining > 0 ? 'bg-red-600 py-3' : '',
          ]"
          >
          <div class="flex list-col-grow items-center space-x-3">
            <svg class="w-5 h-5 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <div class="font-medium text-sm italic"
              :class="[
                timer.remaining < 60 && timer.remaining > 0 ? 'text-red-50' : ''
              ]"
              >{{ timer.label }}</div>
              <div
              :class="[
                timer.remaining < 60 && timer.remaining > 0 ? 'text-2xl font-medium text-red-50 leading-5' : 'text-xs text-base-content/80',
                bouncingTimers.has(timer.id) ? 'animate-bounce' : ''
              ]"
              >{{ formatDuration(timer.remaining) || 'Complete' }}<span v-show="timer.status === 'paused'" class="italic text-xs"> (paused)</span></div>
            </div>
          </div>

          <!-- Timer controls -->
          <div class="flex items-center gap-1">
            <!-- Running - show pause -->
             <template v-if="timer.status === 'running'">
              <div class="join">
                <button @click="addMinute(timer.id)"
                class="cursor-pointer join-item py-1.5 px-3 rounded-l-full bg-base-100 border border-base-300 hover:bg-green-700/70 hover:text-green-50 text-xs font-bold">
                +1m
              </button>
              <button @click="pauseTimer(timer.id)"
              class="cursor-pointer join-item py-1.5 px-3 rounded-r-full bg-base-100 border border-base-300 hover:bg-amber-400/70 hover:text-amber-800">
              <PauseIcon class="w-5 h-5" /> 
            </button>
              </div>
             </template>
            

            <!-- Paused - show reset, +1m, and resume -->
            <template v-else-if="timer.status === 'paused'">
              <div class="join">
              <button @click="resetTimer(timer.id)"
                class="cursor-pointer join-item py-1.5 px-3 rounded-l-full bg-base-100 border border-base-300 hover:bg-red-700/70 hover:text-red-50">
                <TrashIcon class="w-5 h-5" />
              </button>
              <button @click="addMinute(timer.id)"
                class="cursor-pointer join-item py-1.5 px-3 bg-base-100 border border-base-300 hover:bg-green-700/70 hover:text-green-50 text-xs font-bold">
                +1m
              </button>
              <button @click="resumeTimer(timer.id)"
                class="cursor-pointer join-item py-1.5 px-3 rounded-r-full bg-base-100 border border-base-300 hover:bg-primary hover:text-primary-content">
                <PlayIcon class="w-5 h-5" />
              </button>
              </div>
            </template>

            <!-- Completed - show checkmark and reset -->
            <template v-else-if="timer.status === 'completed'">
              <span class="text-emerald-500 pr-2.5">
                <CheckIcon class="w-5 h-5" />
              </span>
              <button @click="resetTimer(timer.id)"
                class="cursor-pointer py-1.5 px-3 rounded-full bg-base-100 border border-base-300 hover:bg-red-700/70 hover:text-red-50">
                <TrashIcon class="w-5 h-5" />
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon, PlayIcon } from '@heroicons/vue/20/solid';
import { PauseIcon, TrashIcon } from '@heroicons/vue/24/outline'; 

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
const { timers, pauseTimer: pause, resetTimer: reset, resumeTimer: resume, addMinute: addMin } = timerManager;

// Computed list of active timers (running, paused, or completed)
const activeTimers = computed(() => {
  const active = Array.from(timers.value.values()).filter(timer => 
    timer.status === 'running' || timer.status === 'paused' || timer.status === 'completed'
  );
  return active;
});

// Timer control methods
const pauseTimer = (id: string) => pause(id);
const resetTimer = (id: string) => reset(id);
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