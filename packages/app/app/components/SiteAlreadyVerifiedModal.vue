<template>
  <dialog ref="dialogRef" class="modal modal-bottom sm:modal-middle">
    <div class="modal-box max-w-md">
      <!-- Close Button -->
      <button @click="closeModal" class="btn btn-sm btn-circle btn-ghost right-4 top-4 absolute">
        <XMarkIcon class="size-5" />
      </button>

      <div class="py-4 text-center">
        <div class="rounded-2xl bg-gradient-to-br from-success/20 to-success/5 size-20 flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon class="text-success size-12" />
        </div>
        <h3 class="mb-2 font-serif text-2xl">Already Connected</h3>
        <p class="text-base-content/70 mb-4 text-sm">
          This site is already verified and connected to your account.
        </p>

        <!-- Site Info -->
        <div class="bg-success/10 border-success/20 rounded-xl flex items-center gap-3 p-4 mb-6 border">
          <div class="bg-success/20 size-10 flex items-center justify-center rounded-lg">
            <GlobeAltIcon class="size-5 text-success" />
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-sm font-medium truncate">{{ site?.name || site?.url }}</p>
            <p class="text-success text-xs">Verified</p>
          </div>
        </div>

        <button @click="closeModal" class="btn btn-primary w-full">
          Got it
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="closeModal">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  XMarkIcon,
  GlobeAltIcon,
  CheckCircleIcon,
} from '@heroicons/vue/24/outline'

interface Site {
  id: number
  url: string
  name?: string
}

const props = defineProps<{
  isOpen: boolean
  site: Site | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    dialogRef.value?.showModal()
  } else {
    dialogRef.value?.close()
  }
})

const closeModal = () => {
  emit('close')
}
</script>
