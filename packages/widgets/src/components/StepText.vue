<template>
  <span v-html="renderedText"></span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface StepLink {
  text: string
  href: string
  target?: string
  rel?: string
}

interface Props {
  text: string
  links?: StepLink[]
}

const props = defineProps<Props>()

const renderedText = computed(() => {
  if (!props.links || props.links.length === 0) {
    return escapeHtml(props.text)
  }

  let result = props.text

  // Sort links by text length (longest first) to avoid partial replacements
  const sortedLinks = [...props.links].sort((a, b) => b.text.length - a.text.length)

  // Replace each link text with an anchor tag
  for (const link of sortedLinks) {
    const escapedText = escapeRegExp(link.text)
    const regex = new RegExp(`\\b${escapedText}\\b`, 'g')

    const targetAttr = link.target ? ` target="${link.target}"` : ''
    const relAttr = link.rel ? ` rel="${link.rel}"` : (link.target === '_blank' ? ' rel="noopener noreferrer"' : '')

    const replacement = `<a href="${escapeHtml(link.href)}" class="cs:text-secondary cs:underline hover:cs:text-secondary/80" ${targetAttr}${relAttr}>${escapeHtml(link.text)}</a>`

    result = result.replace(regex, replacement)
  }

  // Escape any remaining text that wasn't part of a link
  // We need to be careful here since we've already added HTML for links
  return result
})

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>
