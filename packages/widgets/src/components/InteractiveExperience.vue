<template>
  <component :is="resolvedComponent" v-bind="carouselProps" />
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue'
import InteractiveCarousel from './InteractiveCarousel.vue'
import InteractiveSplit from './InteractiveSplit.vue'
import InteractiveCinematic from './InteractiveCinematic.vue'
import { resolveThemeComponent, THEME_FALLBACK } from './InteractiveExperience'

export { resolveThemeComponent, THEME_FALLBACK }

const THEME_MAP: Record<string, any> = {
  carousel: InteractiveCarousel,
  split: InteractiveSplit,
  cinematic: InteractiveCinematic,
}

export default defineComponent({
  name: 'InteractiveExperience',

  props: {
    creationId: {
      type: String,
      default: undefined
    },
    domain: {
      type: String,
      default: undefined
    },
    baseUrl: {
      type: String,
      default: ''
    },
    hideAttribution: {
      type: Boolean,
      default: false
    },
    cacheBust: {
      type: Boolean,
      default: false
    },
    disableRatingSubmission: {
      type: Boolean,
      default: false
    },
    unitConversionConfig: {
      type: Object,
      default: undefined
    },
    config: {
      type: Object,
      default: undefined
    },
    themeDesktop: {
      type: String,
      default: undefined
    },
    themeMobile: {
      type: String,
      default: undefined
    },
  },

  setup(props) {
    const isMobile = ref(false)

    let mediaQuery: MediaQueryList | null = null
    const handleMediaChange = (e: MediaQueryListEvent) => {
      isMobile.value = e.matches
    }

    onMounted(() => {
      if (typeof window !== 'undefined') {
        mediaQuery = window.matchMedia('(max-width: 768px)')
        isMobile.value = mediaQuery.matches
        mediaQuery.addEventListener('change', handleMediaChange)
      }
    })

    onUnmounted(() => {
      if (mediaQuery) {
        mediaQuery.removeEventListener('change', handleMediaChange)
      }
    })

    // Theme props can come as top-level props (when rendered inline by InteractiveModeWidget)
    // or inside props.config (when mounted directly by the SDK via MountManager)
    const resolvedThemeName = computed(() =>
      resolveThemeComponent(
        props.themeDesktop || props.config?.themeDesktop,
        props.themeMobile || props.config?.themeMobile,
        isMobile.value
      )
    )

    const resolvedComponent = computed(() => THEME_MAP[resolvedThemeName.value] ?? InteractiveCarousel)

    // Pass all props except the theme-specific ones down to the resolved component
    const carouselProps = computed(() => {
      const { themeDesktop: _td, themeMobile: _tm, ...rest } = props
      return rest
    })

    return {
      resolvedComponent,
      carouselProps,
    }
  }
})
</script>
