<template>  
    <div class=" inline-block w-full h-auto overflow-hidden">
        <img class="aspect-[3/2] rounded-2xl object-cover w-full h-auto mb-10 shadow-xl"
        :src="src"/>
    </div>
</template>

<script setup lang="ts"> 
const props = defineProps<{ src?: string}>()
</script>