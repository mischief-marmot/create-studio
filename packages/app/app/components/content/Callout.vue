<template>
  <div
    class="rounded-xl border-info/20 relative my-8 overflow-hidden border"
  >
    <!-- Accent bar -->
    <div
      class="bg-info absolute left-0"
      style="width: 10px; height: 40%; top: 30%; background-color: var(--color-accent); border-radius: 0 100px 100px 0;"
    ></div>

    <!-- Content container -->
    <div class="px-8 py-5 pl-8 pr-6">
      <span
        v-if="title"
        class="text-accent opacity-90 text-md mb-2 font-medium tracking-wide uppercase"
      >
        {{ title }}
      </span>
      <div
        class="callout-content max-w-none prose-strong:text-info prose-strong:font-semibold text-base-content"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
}

defineProps<Props>()
</script>

<style scoped>
/* Remove paragraph margins in callout content */
.callout-content :deep(p) {
  margin: 0 !important;
  line-height: 1.6;
}

/* Spacing between consecutive paragraphs */
.callout-content :deep(p + p) {
  margin-top: 0.75rem !important;
}

/* Better list spacing */
.callout-content :deep(ul),
.callout-content :deep(ol) {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
  padding-left: 1.5rem;
}

.callout-content :deep(li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

/* Remove default link underlines in callouts */
.callout-content :deep(a) {
  text-decoration-line: none;
  font-weight: 500;
  transition: all 0.2s;
}

.callout-content :deep(a:hover) {
  text-decoration-line: underline;
  text-underline-offset: 2px;
}

/* Code styling within callouts */
.callout-content :deep(code) {
  font-size: 0.875em;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background-color: rgb(0 0 0 / 0.05);
  font-weight: 500;
}
</style>