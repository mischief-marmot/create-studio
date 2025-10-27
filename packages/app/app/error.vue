<template>
    <NuxtLayout name="main" class="max-h-screen">
        <div class="sm:px-6 lg:px-8 bg-base-100 flex flex-col items-center justify-center min-h-screen px-4 py-12">
            <div class=" flex flex-col items-center justify-center space-y-16 prose text-center">
                <div class="flex items-end justify-center space-x-4 font-serif font-bold">
                    <template v-for="char, idx in error.statusCode.toString().split('')" :key="idx">
                        <Solo v-if="char === '0'" class="h-72 animate-spin-slow w-auto" />
                        <span v-else class="" style="font-size: 24rem; height: 24rem; display: flex; align-items: center;">{{ char }}</span>
                    </template>
                </div>
                <p class="text-balance max-w-xl text-5xl">{{ error.message }}</p>
                <a href="/" class="btn btn-primary btn-2xl">Go Home</a>
            </div>
        </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import Solo from './components/Logo/Solo.vue'

const props = defineProps({
    error: Object as () => NuxtError,
})
</script>