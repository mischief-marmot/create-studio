<template>
    <!-- Upgrade Banner (Free tier only) -->
        <div class="relative">
          <div
            :class="`relative isolate flex items-center gap-x-6 overflow-hidden px-6 py-2.5 sm:before:flex-1 bg-${kind} text-${kind}-content`">
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span class="md:hidden">{{ smallText }}</span>
              <span class="hidden md:inline">{{ fullText }}</span>
              <button @click="buttonAction"
                class="btn btn-success shadow-xl ring-1 ">
                {{ buttonText }}
              </button>
            </div>
            <div class="flex flex-1 justify-end">
              <button type="button" @click="dismissAction" class="-m-3 p-3 focus-visible:-outline-offset-4 cursor-pointer">
                <span class="sr-only">Dismiss</span>
                <XMarkIcon :class="`size-8 text-${kind}-content`" aria-hidden="true" />
              </button>
            </div>
          </div>

        </div>  
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/20/solid';

interface Props {
  fullText: string;
  dismissAction: VoidFunction;
  buttonText: string;
  buttonAction: VoidFunction;
  smallText?: string;
  kind?: 'success' | 'warning' | 'info' | 'primary' | 'secondary' | 'error' | 'neutral';
}

withDefaults(defineProps<Props>(), {
  fullText: '',
  smallText: '',
  buttonText: '',
  dismissAction: () => {},
  buttonAction: () => {},
  kind: 'success',
});
</script>