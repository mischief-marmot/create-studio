<template>
  <dialog ref="dialogRef" class="cs:modal">
    <div class="cs:modal-box">
      <!-- Icon -->
      <div class="cs:flex cs:justify-center cs:mb-4">
        <div class="cs:w-12 cs:h-12 cs:rounded-full cs:bg-blue-100 cs:flex cs:items-center cs:justify-center">
          <BellIcon class="cs:w-6 cs:h-6 cs:text-blue-600" />
        </div>
      </div>

      <!-- Title -->
      <h3 class="cs:font-bold cs:text-lg cs:text-center">Enable Timer Notifications?</h3>

      <!-- Description -->
      <p class="cs:py-4 cs:text-center">
        Get notified when your timer finishes, even if you switch tabs or minimize your browser.
      </p>

      <!-- Buttons -->
      <div class="cs:modal-action cs:justify-center">
        <button @click="handleDecline" class="cs:btn cs:btn-ghost">
          Not Now
        </button>
        <button @click="handleAllow" class="cs:btn cs:btn-primary">
          Allow Notifications
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
import { BellIcon } from '@heroicons/vue/24/outline'

const emit = defineEmits<{
  allow: [permission: NotificationPermission]
  decline: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

const show = () => {
  if (dialogRef.value) {
    dialogRef.value.showModal()
  }
}

const handleAllow = async () => {
  // Close modal first
  if (dialogRef.value) {
    dialogRef.value.close()
  }

  // Request permission if available
  if ('Notification' in window && Notification.permission !== 'granted') {
    try {
      const permission = await Notification.requestPermission()
      emit('allow', permission)
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    emit('allow', 'granted')
  }
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
