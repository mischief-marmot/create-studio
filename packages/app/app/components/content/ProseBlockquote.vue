<template>
  <blockquote>
    <slot/>
  </blockquote>
</template>

<style setup>
.prose blockquote {
  background-color: var(--color-success);
  color: var(--color-success-content);
  padding-left: calc(var(--spacing) * 6);
  padding-right: calc(var(--spacing) * 3);
  overflow: hidden;
  border-radius: calc(var(--radius-xl));
  border: none;
}
.prose blockquote:not(:first-of-type) {
   background-color: var(--color-primary);
  color: var(--color-primary-content);
}
.prose blockquote:last-of-type {
   background-color: var(--color-secondary);
  color: var(--color-secondary-content);
}
.prose blockquote p::before,
.prose blockquote p::after {
  content: '';
}
</style>