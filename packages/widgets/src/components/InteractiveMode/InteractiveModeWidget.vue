<template>
  <div class="cs-interactive-mode"
    :class="[inDomRendering ? 'cs-interactive-mode-pro' : 'cs-interactive-mode-free']"
  >
    <!-- Button variant (default) -->
    <button
      v-if="ctaVariant === 'button'"
      ref="interactiveButton"
      class="cs-interactive-mode-btn"
      :style="shouldBounce ? {animation: 'bounce 1s 3'} : {}"
      @click="openModal"
    >
      {{ buttonText }}
      <ArrowTopRightOnSquareIcon
        v-if="!inDomRendering"
        class="cs:w-4 cs:h-4 cs:inline-block cs:ml-1"
      />
    </button>

    <!-- Inline Banner variant -->
    <InteractiveModeBanner
      v-else-if="ctaVariant === 'inline-banner'"
      :title="ctaTitle"
      :subtitle="ctaSubtitle"
      :opens-in-new-tab="!inDomRendering"
      @activate="openModal"
      @rendered="handleCtaRendered"
    />

    <!-- Sticky Bar variant -->
    <InteractiveModeSticky
      v-else-if="ctaVariant === 'sticky-bar'"
      :title="ctaTitle"
      :subtitle="ctaSubtitle"
      :button-text="buttonText"
      :opens-in-new-tab="!inDomRendering"
      @activate="openModal"
      @rendered="handleCtaRendered"
    />

    <!-- Tooltip variant -->
    <InteractiveModeTooltip
      v-else-if="ctaVariant === 'tooltip'"
      :title="ctaTitle"
      :button-text="props.config.buttonText"
      :opens-in-new-tab="!inDomRendering"
      @activate="openModal"
      @rendered="handleCtaRendered"
    />

    <Teleport :to="teleportTarget">
      <!-- Side-by-side Modal Container -->
      <div
        v-if="showModal"
        ref="modalContainer"
        id="create-studio-interactive-mode"
        class="cs-interactive-mode-modal cs:fixed cs:top-0 cs:left-0 cs:h-screen cs:flex cs:z-1000000000 cs:font-sans"
        tabindex="-1"
        @keydown.esc="closeModal"
      >
        <!-- Modal Content Area -->
        <div class="cs:w-screen cs:h-full cs:bg-gray-100 cs:relative cs:flex cs:items-center cs:justify-center">
          <button
            class="cs-interactive-mode-close-modal cs:absolute cs:top-4 cs:right-4 cs:p-2 cs:rounded-full cs:transition-all cs:duration-200 cs:cursor-pointer cs:flex cs:items-center cs:justify-center cs:z-10 cs:hover:bg-gray-300 cs:bg-base-100! cs:text-base-content! cs:border cs:border-base-content cs:w-auto!"
            @click="closeModal"
            aria-label="Close"
          >
            <XMarkIcon class="cs:w-6 cs:h-6" />
          </button>

          <div
            :id="`create-studio-modal-${config.creationId}`"
            class="cs:w-full cs:h-full cs:mx-auto"
          >
            <InteractiveExperience
              :creation-id="config.creationId"
              :domain="domain"
              :base-url="baseUrl"
              :disable-rating-submission="config.disableRatingSubmission"
              :unit-conversion-config="config.unitConversion"
              hide-attribution
              class="cs:w-full cs:h-full"
            />
          </div>
        </div>
      </div>

      <!-- Overlay to prevent interaction with original content -->
      <div
        v-if="showModal"
        class="cs:fixed cs:top-0 cs:left-0 cs:w-screen cs:h-screen cs:z-[999999999] cs:cursor-pointer"
        @click="handleOverlayClick"
      />
    </Teleport>
  </div>
</template>
 
<script setup lang="ts">
import { XMarkIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/20/solid'
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import { SharedStorageManager } from '@create-studio/shared/lib/shared-storage/shared-storage-manager'
import { createCreationKey, normalizeDomain } from '@create-studio/shared/utils/domain'
import { encodeStateSnapshot } from '@create-studio/shared/utils/state-snapshot'
import { useLogger } from '@create-studio/shared/utils/logger'
import { useAnalytics } from '../../composables/useAnalytics'
import InteractiveExperience from '../InteractiveExperience.vue'
import InteractiveModeBanner from './InteractiveModeBanner.vue'
import InteractiveModeSticky from './InteractiveModeSticky.vue'
import InteractiveModeTooltip from './InteractiveModeTooltip.vue'
import type { CtaVariant } from './types'

interface Props {
  config: {
    creationId: string
    creationName?: string
    buttonText?: string
    ctaVariant?: CtaVariant
    ctaTitle?: string
    ctaSubtitle?: string
    siteUrl?: string
    embedUrl?: string
    theme?: Record<string, string>
    disableRatingSubmission?: boolean
    unitConversion?: {
      enabled: boolean
      default_system: 'auto' | 'us_customary' | 'metric'
      source_system: 'us_customary' | 'metric'
      label: string
      conversions: Record<string, { amount: string; unit: string; max_amount?: string | null }>
    }
  }
  storage?: any
}

const props = defineProps<Props>()

const globalConfig = inject<any>('widgetConfig')
const logger = useLogger('InteractiveModeWidget', globalConfig?.debug || true)

// Check if in-DOM rendering is enabled (Pro tier feature)
const inDomRendering = computed(() => {
  return globalConfig?.features?.inDomRendering || false
})

// CTA variant from config (Pro tier feature, defaults to 'button')
const ctaVariant = computed<CtaVariant>(() => {
  return props.config.ctaVariant || globalConfig?.ctaVariant || 'button'
})

// CTA title and subtitle (Pro tier customization)
const ctaTitle = computed(() => {
  return props.config.ctaTitle || globalConfig?.ctaTitle || ''
})

const ctaSubtitle = computed(() => {
  return props.config.ctaSubtitle || globalConfig?.ctaSubtitle || ''
})

const showModal = ref(false)
const scrollPosition = ref(0)
const viewportWidth = ref(window.innerWidth)
const modalContainer = ref<HTMLElement | null>(null)
const interactiveButton = ref<HTMLElement | null>(null)

// Cached reference to the FreePlus standalone tab so repeat clicks refocus the existing
// tab instead of opening a duplicate. Lost if the publisher's page reloads — acceptable.
let interactiveWindow: Window | null = null

// CTA impression tracking fires once, regardless of which variant emits. Each variant
// owns its own "am I actually visible" detection (IntersectionObserver on its root,
// or in sticky's case the existing observer on .mv-create-instructions).
let ctaRenderedFired = false
function handleCtaRendered() {
  if (ctaRenderedFired) return
  ctaRenderedFired = true
  analytics.trackCtaRendered(ctaVariant.value)
}

// Mobile detection
const isMobile = ref(false)

// Bounce animation state
const shouldBounce = ref(false)

// Initialize shared storage manager
const storageManager = new SharedStorageManager()

// Theme support can be added later if needed via CSS custom properties

// Create creation key from domain and creation ID
const creationKey = computed(() => {
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  return createCreationKey(domain, props.config.creationId)
})

// Dynamic button text based on interaction state
const buttonText = computed(() => {
  if (props.config.buttonText) {
    return props.config.buttonText
  }

  // Check if user has interacted with this creation
  const creationState = storageManager.getCreationState(creationKey.value)
  const hasInteracted = creationState?.hasInteracted || false

  return hasInteracted ? 'Continue' : 'Try Interactive Mode!'
})

// Extract domain from site URL for InteractiveExperience
const domain = computed(() => {
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  return normalizeDomain(siteUrl)
})

// Base URL for API calls
const baseUrl = computed(() => {
  return props.config.embedUrl || globalConfig?._meta?.baseUrl || window.location.origin
})

const interactiveUrl = computed(() => {
  logger.debug('Props', props.config)
  return `${baseUrl.value}/creations/${creationKey.value}/interactive`
})

// Bundle the publisher-side state (current creation's servings, checklist, step, timers
// + unit preference) into the URL so the standalone page on create.studio can hydrate it.
// localStorage is origin-scoped, so this is the only way to carry state across tabs.
function buildInteractiveUrlWithState(): string {
  storageManager.syncFromStorage()
  const state = storageManager.getCreationState(creationKey.value)
  const units = storageManager.getPreferences().units
  if (!state && !units) return interactiveUrl.value
  const snapshot = {
    state: state ? { [creationKey.value]: state } : {},
    preferences: units ? { units } : {}
  }
  const encoded = encodeURIComponent(encodeStateSnapshot(snapshot))
  const sep = interactiveUrl.value.includes('?') ? '&' : '?'
  return `${interactiveUrl.value}${sep}cs_state=${encoded}`
}

// Analytics for tracking CTA activations
const analytics = useAnalytics({
  domain: domain.value,
  creationId: props.config.creationId,
  baseUrl: baseUrl.value
})

// Teleport target - will be set after component mounts
const teleportTarget = ref<string | HTMLElement>('body')

function openModal() {
  logger.info('🎬 Opening modal', {
    inDomRendering: inDomRendering.value,
    creationId: props.config.creationId,
    creationKey: creationKey.value,
    interactiveUrl: interactiveUrl.value,
    baseUrl: baseUrl.value,
    globalConfig: globalConfig
  })

  analytics.trackCtaActivated(ctaVariant.value)
  analytics.sendBatch()

  // FreePlus (non-Pro) opens the standalone interactive page in a new tab instead of
  // mounting an iframe modal. This prevents ad-rendering issues inside iframes and
  // creates upgrade pressure since the reader leaves the publisher's page.
  // `noopener` is intentionally omitted so the standalone page can call
  // window.opener.focus() to switch back to the publisher's tab. Both tabs are Create-
  // controlled (widget on publisher's site opens Studio's page) so the trust is fine.
  if (!inDomRendering.value) {
    // If the tab we opened previously is still alive, refocus it instead of spawning a
    // duplicate — this preserves the reader's place (timers, checked ingredients, etc.).
    if (interactiveWindow && !interactiveWindow.closed) {
      interactiveWindow.focus()
      return
    }
    interactiveWindow = window.open(buildInteractiveUrlWithState(), '_blank')
    // Register the new tab for bidirectional storage sync during the session. The URL
    // param hydration handles initial state; linkWindow keeps them in sync after that.
    if (interactiveWindow) {
      try {
        storageManager.linkWindow(interactiveWindow, new URL(baseUrl.value).origin)
      } catch {
        // Silent — bad baseUrl
      }
    }
    return
  }

  showModal.value = true

  // Capture current viewport and scroll to modal
  viewportWidth.value = window.innerWidth

  // Save original body overflow style
  document.body.style.overflow = 'hidden'

  // Set scroll position to 0 to show modal in viewport
  scrollPosition.value = 0

  // Sync from localStorage before initializing to avoid overwriting checked state.
  // The storageManager was created at component mount, before syncIngredientChecklists
  // wrote the creation key — so its in-memory state may not have the key, causing
  // initializeCreation to create a fresh empty state and wipe checked boxes.
  storageManager.syncFromStorage()
  // Initialize creation in shared storage when modal opens
  const siteUrl = props.config.siteUrl || globalConfig?.siteUrl || window.location.origin
  const domain = normalizeDomain(siteUrl)
  storageManager.initializeCreation(domain, props.config.creationId)

  // Focus the modal container after it's rendered
  setTimeout(() => {
    modalContainer.value?.focus()
    disableGrowWidget()
  }, 0)

  if (globalConfig?._meta?.debug) {
    logger.debug('Create Studio Interactive mode opened for creation:', props.config.creationId)
    logger.debug('Creation key:', creationKey.value)
    logger.debug('interactive url:', interactiveUrl.value)
    logger.debug('Mobile mode:', isMobile.value)
    logger.debug('Viewport width:', viewportWidth)
  }
}

function disableGrowWidget() {
  const growRoot = document.querySelector('div#grow-me-root')
  if (growRoot ) {
    growRoot.setAttribute('style', 'display:none')
  }
}

function enableGrowWidget() {
  const growRoot = document.querySelector('div#grow-me-root')
  if (growRoot ) {
    growRoot.setAttribute('style', '')
  }
}

function closeModal() {
  // Animate scroll back to original content
  scrollPosition.value = 0
  showModal.value = false

  // Restore body overflow
  document.body.style.overflow = ''

  // Show Grow widget directly (when using in-DOM rendering)
  enableGrowWidget()
}

function handleOverlayClick(event: MouseEvent) {
  logger.debug('Overlay click', event.target, event.currentTarget)
  if (event.target === event.currentTarget) {
    logger.debug('Closing modal due to overlay click')
    closeModal()
  }
}

function handleEscKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && showModal.value) {
    logger.debug('🔑 Escape key pressed, closing modal')
    event.preventDefault()
    event.stopPropagation()
    closeModal()
  }
}

function handleResize() {
  viewportWidth.value = window.innerWidth
  // Update scroll position if modal is open to maintain alignment
  if (showModal.value) {
    scrollPosition.value = -viewportWidth.value
  }
}

function handleVisibilityChange() {
  // Refocus modal when user returns to the tab
  if (!document.hidden && showModal.value) {
    modalContainer.value?.focus()
  }
}

onMounted(() => {
  // Inline-button variant doesn't go through a child component, so observe the button
  // element directly. Other variants emit @rendered when they become visible.
  if (ctaVariant.value === 'button' && interactiveButton.value) {
    const buttonObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            handleCtaRendered()
            buttonObserver.disconnect()
          }
        }
      },
      { threshold: 0 }
    )
    buttonObserver.observe(interactiveButton.value)
    onBeforeUnmount(() => buttonObserver.disconnect())
  }

  // Detect if device is mobile/tablet
  isMobile.value = window.matchMedia('(max-width: 768px)').matches

  // Listen for screen size changes
  const mediaQuery = window.matchMedia('(max-width: 768px)')
  const handleMediaChange = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }
  mediaQuery.addEventListener('change', handleMediaChange)

  // Add resize listener for viewport width updates
  window.addEventListener('resize', handleResize)

  document.addEventListener('keydown', handleEscKey)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  // Add message listener for notification permission requests from iframe
  window.addEventListener('message', handleNotificationPermissionRequest)

  // Find the Create card to teleport into
  const button = document.querySelector('.cs-interactive-mode-btn')
  const card = button?.closest('.mv-create-card')

  if (card) {
    teleportTarget.value = card as HTMLElement
  } else {
    teleportTarget.value = 'body'
  }

  // Setup intersection observer for bounce animation (only for free tier)
  if (interactiveButton.value && !inDomRendering.value) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldBounce.value) {
            logger.debug('🎯 Button came into view, starting bounce animation')
            shouldBounce.value = true
          }
        })
      },
      {
        threshold: 1, // Trigger when 100% of button is visible
        rootMargin: '0px'
      }
    )

    observer.observe(interactiveButton.value)

    // Cleanup observer
    onBeforeUnmount(() => {
      observer.disconnect()
    })
  }

  // Cleanup function for media query listener
  onBeforeUnmount(() => {
    mediaQuery.removeEventListener('change', handleMediaChange)
  })
})

// Handle notification permission request from iframe
async function handleNotificationPermissionRequest(event: MessageEvent) {
  // Only process our specific message type
  if (event.data?.type !== 'CREATE_STUDIO_REQUEST_NOTIFICATION_PERMISSION') {
    return
  }

  logger.info('📨 Received notification permission request from iframe:', event.data.data)

  // Request notification permission in parent window context
  if ('Notification' in window) {
    logger.info('📊 Current permission:', Notification.permission)

    if (Notification.permission === 'default') {
      logger.info('🔔 Requesting browser notification permission...')

      try {
        const permission = await Notification.requestPermission()
        logger.info('📋 Browser permission result:', permission)

        if (permission === 'granted') {
          logger.info('✅ Notifications enabled!')
          // Could register timer with Service Worker here if needed in the future
        }
      } catch (error) {
        logger.error('⚠️  Error requesting notification permission:', error)
      }
    } else if (Notification.permission === 'granted') {
      logger.info('✅ Notifications already granted')
    } else {
      logger.warn('❌ Notifications are blocked')
    }
  }
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscKey)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('message', handleNotificationPermissionRequest)
})
</script>

