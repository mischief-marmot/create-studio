<template>  
    <div class="rounded-2xl relative inline-block w-full h-auto my-3 overflow-hidden shadow-xl">
        <img class="aspect-[3/2] object-cover w-full h-auto my-0!"
        :src="src"/>
    </div>
</template>

<script setup lang="ts"> 
const props = defineProps<{ src?: string}>()
</script>