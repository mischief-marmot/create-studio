<script lang="ts" setup>
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('news', route.params.slug).first()
})
</script>

<template>
  <ContentRenderer v-if="page" :value="page" />
</template>
