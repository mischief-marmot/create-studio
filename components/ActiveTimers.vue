<template>
  <div v-if="activeTimers.length > 0"
    class="absolute bottom-[120%] left-0 right-0 mx-auto bg-gray-100 rounded-xl border-[0.5px] border-gray-300/60 shadow-xl overflow-y-auto max-w-[90%] max-h-[50vh]">
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
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              :class="
                timer.remaining < 60 && timer.remaining > 0 ? 'text-2xl font-medium text-red-50 leading-5' : 'text-xs text-gray-500'
              "
              >{{ formatDuration(timer.remaining) || 'Complete' }}</div>
            </div>
          </div>

          <!-- Timer controls -->
          <div class="flex items-center gap-1">
            <!-- Running - show pause -->
            <button v-if="timer.status === 'running'" @click="pauseTimer(timer.id)"
              class="cursor-pointer py-1.5 px-3 rounded-full bg-white border border-gray-300 hover:bg-gray-100">
              <PauseIcon class="w-5 h-5" /> 
            </button>

            <!-- Paused - show resume and reset -->
            <template v-else-if="timer.status === 'paused'">
              <div class="join">
              <button @click="resetTimer(timer.id)"
                class="cursor-pointer join-item py-1.5 px-3 rounded-l-full bg-white border border-gray-300 hover:bg-red-700/70 hover:text-red-50">
                <TrashIcon class="w-5 h-5" />
              </button>
              <button @click="resumeTimer(timer.id)"
                class="cursor-pointer join-item py-1.5 px-3 rounded-r-full bg-white border border-gray-300 hover:bg-gray-100">
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
                class="cursor-pointer py-1.5 px-3 rounded-full bg-white border border-gray-300 hover:bg-red-700/70 hover:text-red-50">
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

// Get timer manager from injection or create new
const timerManager = inject('timerManager', useTimerManager());
const { timers, pauseTimer: pause, resetTimer: reset, resumeTimer: resume } = timerManager;

// Computed list of active timers (running, paused, or completed)
const activeTimers = computed(() => {
  return Array.from(timers.value.values()).filter(timer => 
    timer.status === 'running' || timer.status === 'paused' || timer.status === 'completed'
  );
});

// Timer control methods
const pauseTimer = (id: string) => pause(id);
const resetTimer = (id: string) => reset(id);
const resumeTimer = (id: string) => resume(id);
</script>