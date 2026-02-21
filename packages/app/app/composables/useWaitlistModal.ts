import { ref } from 'vue'

const showWaitlistModal = ref(false)

export const useWaitlistModal = () => {
  const openWaitlistModal = () => {
    showWaitlistModal.value = true
  }

  const closeWaitlistModal = () => {
    showWaitlistModal.value = false
  }

  return {
    showWaitlistModal,
    openWaitlistModal,
    closeWaitlistModal,
  }
}
