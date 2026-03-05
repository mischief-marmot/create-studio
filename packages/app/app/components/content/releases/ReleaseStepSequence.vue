<template>
  <div class="relative">
    <TransitionGroup name="step" tag="div">
      <div
        v-for="(step, index) in steps"
        v-show="index <= currentStep"
        :key="step.id || index"
        class="mb-3"
      >
        <slot name="step" :step="step" :index="index" :is-active="index === currentStep" :is-complete="index < currentStep" />
      </div>
    </TransitionGroup>

    <button
      v-if="currentStep < steps.length - 1"
      class="btn btn-primary btn-sm mt-4"
      @click="advance"
    >
      <slot name="button" :current-step="currentStep">
        {{ steps[currentStep + 1]?.buttonLabel || 'Next' }}
      </slot>
    </button>

    <div v-if="currentStep >= steps.length - 1 && $slots.complete" class="mt-4">
      <Transition name="fade">
        <slot name="complete" />
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Step {
  id?: string
  buttonLabel?: string
  [key: string]: any
}

const props = defineProps<{
  steps: Step[]
}>()

const currentStep = ref(0)

const advance = () => {
  if (currentStep.value < props.steps.length - 1) {
    currentStep.value++
  }
}

const reset = () => {
  currentStep.value = 0
}

defineExpose({ advance, reset, currentStep })
</script>

<style scoped>
.step-enter-active {
  transition: all 0.3s ease-out;
}
.step-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-enter-active {
  transition: opacity 0.4s ease;
}
.fade-enter-from {
  opacity: 0;
}
</style>
