import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import InteractiveSplit from '../InteractiveSplit.vue'

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockCreation = {
  '@type': 'Recipe',
  name: 'Chocolate Cake',
  description: 'A delicious chocolate cake.',
  step: [
    { text: 'Mix flour and sugar', name: 'Step 1' },
    { text: 'Add eggs and butter', name: 'Step 2' },
    { text: 'Bake at 350°F for 30 minutes', name: 'Step 3' },
  ],
  recipeIngredient: ['2 cups flour', '1 cup sugar', '3 eggs', '1/2 cup butter'],
  image: 'https://example.com/cake.jpg',
}

const mockConfig = {
  creationId: '42',
  domain: 'example.com',
  baseUrl: 'http://localhost:3000',
  disableRatingSubmission: true,
}

// ─── Composable mocks ─────────────────────────────────────────────────────────

vi.mock('../../composables/useInteractiveCreation', () => ({
  useInteractiveCreation: vi.fn(() => ({
    creation: ref(mockCreation),
    isLoadingCreation: ref(false),
    creationError: ref(null),
    dataReady: computed(() => true),
    steps: computed(() => mockCreation.step),
    suppliesLabel: computed(() => 'Ingredients'),
    loadCreationData: vi.fn(),
  })),
}))

vi.mock('../../composables/useInteractiveNavigation', () => ({
  useInteractiveNavigation: vi.fn(() => ({
    currentSlide: ref(1),
    totalSlides: computed(() => mockCreation.step.length + 2),
    goToSlide: vi.fn(),
    nextSlide: vi.fn(),
    previousSlide: vi.fn(),
  })),
}))

vi.mock('../../composables/useInteractiveIngredients', () => ({
  useInteractiveIngredients: vi.fn(() => ({
    suppliesLabel: computed(() => 'Ingredients'),
    adjustedIngredients: computed(() => mockCreation.recipeIngredient),
    adjustedIngredientsGroups: computed(() => null),
    adjustedYield: computed(() => null),
  })),
}))

vi.mock('../../composables/useInteractiveImage', () => ({
  useInteractiveImage: vi.fn(() => ({
    imageHeight: ref(25),
    isImageCollapsed: ref(false),
    isDragging: ref(false),
    imageHeightPx: computed(() => 150),
    toggleImageCollapse: vi.fn(),
    startDrag: vi.fn(),
  })),
}))

vi.mock('../../composables/useInteractiveReview', () => ({
  useInteractiveReview: vi.fn(() => ({
    currentRating: ref(0),
    hasSubmittedRating: ref(false),
    hasSubmittedReview: ref(false),
    existingReview: ref(null),
    form: { title: '', review: '', name: '', email: '' },
    reviewQuestionText: computed(() => 'How was it?'),
    showRatingSubmittedMessage: computed(() => false),
    showLowRatingPrompt: computed(() => false),
    showReviewForm: computed(() => false),
    isFormValid: computed(() => true),
    handleRatingSelect: vi.fn(),
    handleFormSubmit: vi.fn(),
    loadExistingReview: vi.fn(),
    reviewSubmission: { isSubmitting: ref(false), submissionError: ref(null) },
  })),
}))

vi.mock('../../composables/useSharedTimerManager', () => ({
  useSharedTimerManager: vi.fn(() => ({
    timers: ref(new Map()),
    restoreTimersFromStore: vi.fn(),
  })),
}))

vi.mock('../../composables/useAnalytics', () => ({
  useAnalytics: vi.fn(() => ({
    trackPageView: vi.fn(),
    trackRatingEvent: vi.fn(),
    trackTimerEvent: vi.fn(),
    sendBatch: vi.fn(),
    userId: 'test-user',
    sessionId: 'test-session',
  })),
}))

// ─── Helper ───────────────────────────────────────────────────────────────────

function mountSplit(props = {}) {
  return mount(InteractiveSplit, {
    props: {
      config: mockConfig,
      ...props,
    },
    global: {
      stubs: {
        // Stub child components that make fetch calls or rely on canvas/media
        RecipeMedia: { template: '<div class="recipe-media-stub" />' },
        RecipeTimer: { template: '<div class="recipe-timer-stub" />' },
        IngredientText: {
          props: ['ingredient'],
          template: '<span class="ingredient-text-stub">{{ ingredient }}</span>',
        },
        StepText: {
          props: ['text', 'links'],
          template: '<span class="step-text-stub">{{ text }}</span>',
        },
        StarRating: { template: '<div class="star-rating-stub" />' },
        TimerWarningModal: { template: '<div class="timer-warning-modal-stub" />' },
        ActiveTimers: { template: '<div class="active-timers-stub" />' },
        DraggableHandle: { template: '<div class="draggable-handle-stub" />' },
        LogoSolo: { template: '<span class="logo-solo-stub" />' },
        LogoWordmark: { template: '<span class="logo-wordmark-stub" />' },
      },
    },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InteractiveSplit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Basic smoke test
  it('renders without crashing', () => {
    const wrapper = mountSplit()
    expect(wrapper.exists()).toBe(true)
  })

  // 2. Recipe title
  it('shows the recipe title', () => {
    const wrapper = mountSplit()
    expect(wrapper.text()).toContain('Chocolate Cake')
  })

  // 3. Ingredients in sidebar
  it('shows ingredients in the sidebar', () => {
    const wrapper = mountSplit()
    // The sidebar must list recipe ingredients
    const sidebar = wrapper.find('.cs-split-sidebar')
    expect(sidebar.exists()).toBe(true)
    expect(sidebar.text()).toContain('2 cups flour')
  })

  // 4. Step content visible
  it('shows step content in the main area', () => {
    const wrapper = mountSplit()
    expect(wrapper.text()).toContain('Mix flour and sugar')
  })

  // 5. Desktop layout - sidebar element
  it('has a sidebar element for the desktop split layout', () => {
    const wrapper = mountSplit()
    expect(wrapper.find('.cs-split-sidebar').exists()).toBe(true)
  })

  // 6. Mobile layout - tab bar
  it('shows the mobile tab bar when isMobile is true', async () => {
    const wrapper = mount(InteractiveSplit, {
      props: {
        config: mockConfig,
        isMobile: true,
      },
      global: {
        stubs: {
          RecipeMedia: { template: '<div class="recipe-media-stub" />' },
          RecipeTimer: { template: '<div class="recipe-timer-stub" />' },
          IngredientText: {
            props: ['ingredient'],
            template: '<span class="ingredient-text-stub">{{ ingredient }}</span>',
          },
          StepText: {
            props: ['text', 'links'],
            template: '<span class="step-text-stub">{{ text }}</span>',
          },
          StarRating: { template: '<div class="star-rating-stub" />' },
          TimerWarningModal: { template: '<div class="timer-warning-modal-stub" />' },
          ActiveTimers: { template: '<div class="active-timers-stub" />' },
          DraggableHandle: { template: '<div class="draggable-handle-stub" />' },
          LogoSolo: { template: '<span class="logo-solo-stub" />' },
          LogoWordmark: { template: '<span class="logo-wordmark-stub" />' },
        },
      },
    })
    expect(wrapper.find('.cs-split-tabs').exists()).toBe(true)
  })

  // 7. Step navigation dots
  it('renders one navigation dot per step', () => {
    const wrapper = mountSplit()
    // mockCreation has 3 steps → expect 3 dots
    const dots = wrapper.findAll('.cs-split-step-dot')
    expect(dots.length).toBe(mockCreation.step.length)
  })

  // 8. Step counter text
  it('shows "Step X of Y" counter text', () => {
    const wrapper = mountSplit()
    // useInteractiveNavigation returns currentSlide=1 and totalSlides=5 (3 steps + 2)
    // The component should show something like "Step 1 of 3"
    expect(wrapper.text()).toMatch(/step\s+\d+\s+of\s+\d+/i)
  })

  // 9. Supplies label
  it('shows "Ingredients" as the supplies label for a Recipe type', () => {
    const wrapper = mountSplit()
    expect(wrapper.text()).toContain('Ingredients')
  })
})
