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
        class="text-accent opacity-90 mb-2 text-sm font-medium tracking-wide uppercase"
      >
        {{ title }}
      </span>
      <div
        class="max-w-none text-base-content/85 prose-p:leading-relaxed prose-strong:text-info prose-strong:font-semibold prose-sm prose"
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
/* Ensure first and last elements don't have extra margins */
.prose > :first-child {
  margin-top: 0;
}

.prose > :last-child {
  margin-bottom: 0;
}

/* Better list spacing */
.prose ul,
.prose ol {
  margin-top: 0.75rem;
  margin-bottom: 0.75rem;
}

.prose li {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

/* Remove default link underlines in callouts */
.prose a {
  text-decoration-line: none;
  font-weight: 500;
  transition: all 0.2s;
}

.prose a:hover {
  text-decoration-line: underline;
  text-underline-offset: 2px;
}

/* Better spacing for paragraphs */
.prose p + p {
  margin-top: 0.75rem;
}

/* Code styling within callouts */
.prose code {
  font-size: 0.875em;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background-color: rgb(0 0 0 / 0.05);
  font-weight: 500;
}
</style>