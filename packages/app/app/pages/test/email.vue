<script setup lang="ts">
definePageMeta({
  layout: false,
})

const templates = ['ConfirmEmail', 'ResetPassword']
const selectedTemplate = ref('ConfirmEmail')
</script>

<template>
  <div class="bg-base-200 min-h-screen p-4">
    <div class="flex items-center gap-4 mb-4">
      <h1 class="text-xl font-bold">Email Preview</h1>
      <select v-model="selectedTemplate" class="select select-bordered">
        <option v-for="t in templates" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>
    <iframe
      :src="`/api/preview/email/${selectedTemplate}`"
      class="w-full h-[calc(100vh-100px)] bg-base-100 rounded-lg border border-base-300"
    />
  </div>
</template>
