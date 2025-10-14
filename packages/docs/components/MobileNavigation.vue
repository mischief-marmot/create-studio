<script setup lang="ts">
import { ref, watch } from 'vue'
import { Dialog, DialogPanel } from '@headlessui/vue'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const isOpen = ref(false)

// Close dialog when route changes
watch(() => route.path, () => {
  isOpen.value = false
})

function onLinkClick(event: MouseEvent) {
  const link = event.currentTarget as HTMLAnchorElement
  if (
    link.pathname + link.search + link.hash ===
    window.location.pathname + window.location.search + window.location.hash
  ) {
    isOpen.value = false
  }
}
</script>

<template>
  <div>
    <button
      type="button"
      class="relative"
      aria-label="Open navigation"
      @click="isOpen = true"
    >
      <Bars3Icon class="h-6 w-6 stroke-slate-500" />
    </button>

    <Dialog
      :open="isOpen"
      class="fixed inset-0 z-50 flex items-start overflow-y-auto bg-slate-900/50 pr-10 backdrop-blur-sm lg:hidden"
      aria-label="Navigation"
      @close="isOpen = false"
    >
      <DialogPanel class="min-h-full w-full max-w-xs bg-white px-4 pt-5 pb-12 sm:px-6 dark:bg-slate-900">
        <div class="flex items-center">
          <button
            type="button"
            aria-label="Close navigation"
            @click="isOpen = false"
          >
            <XMarkIcon class="h-6 w-6 stroke-slate-500" />
          </button>
          <NuxtLink to="/" class="ml-6" aria-label="Home page">
            <Logomark class-name="h-9 w-9 stroke-sky-500" />
          </NuxtLink>
        </div>
        <Navigation class="mt-5 px-1" :on-link-click="onLinkClick" />
      </DialogPanel>
    </Dialog>
  </div>
</template>
