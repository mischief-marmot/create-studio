<template>
  <!-- Backdrop -->
  <div
    v-if="isOpen"
    class="cs:fixed cs:inset-0 cs:bg-black/50 cs:z-[1000000001] cs:flex cs:items-center cs:justify-center"
    @click="handleBackdropClick"
  >
    <!-- Modal Box -->
    <div
      class="cs:bg-base-100 cs:rounded-2xl cs:p-6 cs:max-w-md cs:w-11/12 cs:shadow-2xl"
      @click.stop
    >
      <!-- Icon -->
      <div class="cs:flex cs:justify-center cs:mb-4">
        <div class="cs:w-12 cs:h-12 cs:rounded-full cs:bg-amber-100 cs:flex cs:items-center cs:justify-center">
          <ClockIcon class="cs:w-6 cs:h-6 cs:text-amber-600" />
        </div>
      </div>

      <!-- Title -->
      <h3 class="cs:font-bold cs:text-lg cs:text-center cs:text-base-content">Timer Active - Stay on Page</h3>

      <!-- Description -->
      <p class="cs:py-4 cs:text-center cs:text-base-content/80">
        Your timer will only run while you stay in interactive mode. If you leave, it will pause and resume from where you left off when you return.
      </p>

      <!-- Buttons -->
      <div class="cs:flex cs:gap-3 cs:justify-center cs:mt-6">
        <button @click="handleDecline" class="cs:btn cs:btn-ghost">
          Cancel
        </button>
        <button @click="handleAccept" class="cs:btn cs:btn-primary">
          Got It, Start Timer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ClockIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  accept: []
  decline: []
}>()

const isOpen = ref(false)

const show = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

const handleAccept = () => {
  close()

  // Store that user has seen this warning (session storage - resets on browser close)
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('timerWarningSeen', 'true')
  }

  emit('accept')
}

const handleDecline = () => {
  close()
  emit('decline')
}

const handleBackdropClick = () => {
  handleDecline()
}

defineExpose({
  show
})
</script>
