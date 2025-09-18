<template>
  <div class="flex justify-center space-x-1">
    <button
      v-for="star in 5"
      :key="star"
      @click="selectRating(star)"
      @mouseenter="hoverRating = star"
      @mouseleave="hoverRating = 0"
      class="focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-full p-1"
      :aria-label="`Rate ${star} star${star !== 1 ? 's' : ''}`"
    >
      <svg
        class="w-8 h-8 transition-colors duration-150"
        :class="getStarClass(star)"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: number
  readonly?: boolean
}

interface Emits {
  'update:modelValue': [rating: number]
  'select': [rating: number]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  readonly: false
})

const emit = defineEmits<Emits>()

const hoverRating = ref(0)

const selectRating = (rating: number) => {
  if (props.readonly) return
  
  emit('update:modelValue', rating)
  emit('select', rating)
}

const getStarClass = (starNumber: number): string => {
  const activeRating = hoverRating.value || props.modelValue
  
  if (starNumber <= activeRating) {
    return 'text-yellow-400'
  }
  
  return 'text-gray-300'
}
</script>