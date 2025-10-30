<template>
  <dialog ref="dialogRef" class="cs:modal">
    <div class="cs:modal-box">
      <!-- Icon -->
      <div class="cs:flex cs:justify-center cs:mb-4">
        <div class="cs:w-12 cs:h-12 cs:rounded-full cs:bg-amber-100 cs:flex cs:items-center cs:justify-center">
          <ClockIcon class="cs:w-6 cs:h-6 cs:text-amber-600" />
        </div>
      </div>

      <!-- Title -->
      <h3 class="cs:font-bold cs:text-lg cs:text-center">Timer Active - Stay on Page</h3>

      <!-- Description -->
      <p class="cs:py-4 cs:text-center cs:text-base-content/80">
        Your timer will only run while you stay in interactive mode. If you leave, it will pause and resume from where you left off when you return.
      </p>

      <!-- Buttons -->
      <div class="cs:modal-action cs:justify-center">
        <button @click="handleDecline" class="cs:btn cs:btn-ghost">
          Cancel
        </button>
        <button @click="handleAccept" class="cs:btn cs:btn-primary">
          Got It, Start Timer
        </button>
      </div>
    </div>
    <form method="dialog" class="cs:modal-backdrop">
      <button @click="handleDecline">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ClockIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  accept: []
  decline: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

const show = () => {
  if (dialogRef.value) {
    dialogRef.value.showModal()
  }
}

const handleAccept = () => {
  if (dialogRef.value) {
    dialogRef.value.close()
  }

  // Store that user has seen this warning (session storage - resets on browser close)
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('timerWarningSeen', 'true')
  }

  emit('accept')
}

const handleDecline = () => {
  if (dialogRef.value) {
    dialogRef.value.close()
  }
  emit('decline')
}

defineExpose({
  show
})
</script>
