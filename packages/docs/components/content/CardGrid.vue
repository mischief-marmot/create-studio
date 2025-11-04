<template>
  <div class="card-grid sm:grid-cols-2 lg:grid-cols-2 grid gap-6 my-8">
    <slot />
  </div>
</template>

<style scoped>
@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>