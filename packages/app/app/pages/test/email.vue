<script setup lang="ts">
definePageMeta({
  layout: false,
})

const templates = ['ConfirmEmail', 'ResetPassword']
const selectedTemplate = ref('ResetPassword')
</script>

<template>
  <div class="min-h-screen bg-base-200 p-4">
    <div class="mb-4 flex items-center gap-4">
      <h1 class="text-xl font-bold">Email Preview</h1>
      <select v-model="selectedTemplate" class="select select-bordered">
        <option v-for="t in templates" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>
    <iframe
      :src="`/api/preview/email/${selectedTemplate}`"
      class="w-full h-[calc(100vh-100px)] bg-white rounded-lg border border-base-300"
    />
  </div>
</template>
