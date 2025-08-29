<template>
  <div class="box-gray flex justify-between">
    <div class="flex items-center space-x-2">
      <svg class="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      <div class="flex flex-col leading-3 justify-center">
        <span class="font-medium italic">{{ timer.label }}</span>
        <span class="text-sm text-gray-500">{{ formattedDuration }}</span>
      </div>
    </div>
    <button
      class="btn btn-md h-auto py-3 shadow-none rounded-full font-normal uppercase text-black bg-gray-200 border-[0.5px] border-gray-400/60 flex justify-center items-center">
      <span class="leading-0">start</span>
      <span>
        <!-- play svg -->
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 330 330" height="16" width="16"
          fill="currentColor">
          <path d="M37.728,328.12c2.266,1.256,4.77,1.88,7.272,1.88c2.763,0,5.522-0.763,7.95-2.28l240-149.999
c4.386-2.741,7.05-7.548,7.05-12.72c0-5.172-2.664-9.979-7.05-12.72L52.95,2.28c-4.625-2.891-10.453-3.043-15.222-0.4
C32.959,4.524,30,9.547,30,15v300C30,320.453,32.959,325.476,37.728,328.12z" />
        </svg>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Timer {
  duration: number;
  label: string;
  autoStart?: boolean;
}

interface Props {
  timer: Timer;
}

const props = defineProps<Props>();
const { formatDuration } = useRecipeUtils();

const formattedDuration = computed(() => formatDuration(props.timer.duration));
</script>