<template>
    <!-- Upgrade Banner (Free tier only) -->
        <div class="relative">
          <div
            :class="`relative isolate flex items-center gap-x-6 overflow-hidden px-6 py-2.5 sm:before:flex-1 bg-${kind} text-${kind}-content`">
            <div class="gap-x-4 gap-y-2 flex flex-wrap items-center">
              <span class="md:hidden">{{ smallText }}</span>
              <span class="md:inline hidden">{{ fullText }}</span>
              <button @click="buttonAction"
                :class="`btn btn-neutral shadow-xl ring-1`">
                {{ buttonText }}
              </button>
            </div>
            <div class="flex justify-end flex-1">
              <button type="button" @click="dismissAction" class="focus-visible:-outline-offset-4 p-3 -m-3 cursor-pointer">
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