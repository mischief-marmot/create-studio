<template>
  <div class="cs:w-full cs:h-full">
    <!-- Video content -->
    <div v-if="video" class="cs:w-full cs:h-full">
      <video
        :key="`video-${videoKey}`"
        :src="getVideoUrl(video)"
        :poster="getVideoThumbnail(video)"
        class="cs:w-full cs:h-full cs:object-cover"
        controls
        preload="metadata"
      >
        <source :src="getVideoUrl(video)" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
    
    <!-- Image content -->
    <img
      v-else-if="image"
      :src="getImageUrl(image)"
      :alt="alt"
      class="cs:w-full cs:h-full cs:object-cover"
    />
    
    <!-- Fallback placeholder -->
    <div v-else class="cs:w-full cs:h-full cs:bg-gradient-to-br" :class="placeholderClass">
      <div class="cs:text-6xl cs:opacity-20">{{ placeholderEmoji }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRecipeUtils } from '../composables/useRecipeUtils'

interface Props {
  video?: any;
  image?: any;
  alt?: string;
  videoKey?: string | number;
  placeholderClass?: string;
  placeholderEmoji?: string;
}

withDefaults(defineProps<Props>(), {
  alt: '',
  videoKey: '',
  placeholderClass: 'from-base-200 to-base-300 flex items-center justify-center',
  placeholderEmoji: '🍽️'
});

const { getImageUrl, getVideoUrl, getVideoThumbnail } = useRecipeUtils();
</script>