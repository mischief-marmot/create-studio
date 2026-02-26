<template>
  <span v-if="parsedIngredient.link">
    <template v-if="parsedIngredient.parts">
      {{ parsedIngredient.parts.before }}<a
        :href="parsedIngredient.link"
        :rel="parsedIngredient.nofollow ? 'nofollow' : undefined"
        :target="isExternalLink ? '_blank' : undefined"
        class="cs:text-blue-500 cs:underline"
      >{{ parsedIngredient.parts.linkText }}</a>{{ parsedIngredient.parts.after }}
    </template>
    <a
      v-else
      :href="parsedIngredient.link"
      :rel="parsedIngredient.nofollow ? 'nofollow' : undefined"
      :target="isExternalLink ? '_blank' : undefined"
      class="cs:text-blue-500 cs:underline"
    >{{ parsedIngredient.text }}</a>
  </span>
  <span v-else>{{ parsedIngredient.text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  ingredient: string | {
    original_text: string
    link?: string
    nofollow?: boolean
  }
}

const props = defineProps<Props>()

const parsedIngredient = computed(() => {
  // If it's a string, just return it
  if (typeof props.ingredient === 'string') {
    return { text: props.ingredient }
  }

  // If it's an object with link, extract the text from brackets
  if (props.ingredient.link && props.ingredient.original_text) {
    // Match pattern: before[linkText]after
    const bracketMatch = props.ingredient.original_text.match(/^(.*?)\[(.*?)\](.*)$/)

    if (bracketMatch) {
      const before = bracketMatch[1]
      const linkText = bracketMatch[2]
      const after = bracketMatch[3]

      return {
        text: props.ingredient.original_text,
        link: props.ingredient.link,
        nofollow: props.ingredient.nofollow,
        parts: { before, linkText, after }
      }
    }

    // No brackets found, use entire text as link
    return {
      text: props.ingredient.original_text,
      link: props.ingredient.link,
      nofollow: props.ingredient.nofollow
    }
  }

  // Fallback to original_text
  return { text: props.ingredient.original_text || '' }
})

const isExternalLink = computed(() => {
  if (!parsedIngredient.value.link) return false

  try {
    const url = new URL(parsedIngredient.value.link, window.location.origin)
    return url.origin !== window.location.origin
  } catch {
    // If URL parsing fails, assume it's external
    return true
  }
})
</script>
