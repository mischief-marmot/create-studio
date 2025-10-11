import { ref } from 'vue'

const showUpgradeModal = ref(false)

export const useUpgradeModal = () => {
  const openModal = () => {
    showUpgradeModal.value = true
  }

  const closeModal = () => {
    showUpgradeModal.value = false
  }

  return {
    showUpgradeModal,
    openModal,
    closeModal,
  }
}
