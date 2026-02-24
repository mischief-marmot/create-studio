import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'
import InteractiveCinematic from '../InteractiveCinematic.vue'

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockCreation = {
  '@type': 'Recipe',
  name: 'Spaghetti Bolognese',
  description: 'A classic Italian meat sauce.',
  step: [
    { text: 'Brown the ground beef', name: 'Step 1', image: 'https://example.com/step1.jpg' },
    { text: 'Add tomato sauce and simmer', name: 'Step 2' },
    { text: 'Cook pasta al dente', name: 'Step 3', image: 'https://example.com/step3.jpg' },
  ],
  recipeIngredient: ['500g ground beef', '2 cans tomato sauce', '400g spaghetti'],
  image: 'https://example.com/bolognese.jpg',
}

const mockConfig = {
  creationId: '77',
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
    currentSlide: ref(0),
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
  })),
}))

// ─── Helper ───────────────────────────────────────────────────────────────────

const globalStubs = {
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
  LogoSolo: { template: '<span class="logo-solo-stub" />' },
}

function mountCinematic(props = {}) {
  return mount(InteractiveCinematic, {
    props: { config: mockConfig, ...props },
    global: { stubs: globalStubs },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('InteractiveCinematic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    expect(mountCinematic().exists()).toBe(true)
  })

  it('shows the recipe title on the intro slide', () => {
    const wrapper = mountCinematic()
    expect(wrapper.text()).toContain('Spaghetti Bolognese')
  })

  it('renders one slide per step plus intro and review slides', () => {
    const wrapper = mountCinematic()
    // 3 steps + intro + review = 5 slides total
    const slides = wrapper.findAll('.cs-cinematic-slide')
    expect(slides.length).toBe(5)
  })

  it('renders progress dots equal to total slides', () => {
    const wrapper = mountCinematic()
    const dots = wrapper.findAll('.cs-cinematic-progress-dot')
    expect(dots.length).toBe(5)
  })

  it('has an ingredients toggle button', () => {
    const wrapper = mountCinematic()
    expect(wrapper.find('.cs-cinematic-ingredients-btn').exists()).toBe(true)
  })

  it('ingredients overlay is hidden by default', () => {
    const wrapper = mountCinematic()
    // The overlay should not be visible initially
    const overlay = wrapper.find('.cs-cinematic-ingredients-overlay')
    expect(overlay.exists()).toBe(false)
  })

  it('shows the ingredients overlay when the button is clicked', async () => {
    const wrapper = mountCinematic()
    await wrapper.find('.cs-cinematic-ingredients-btn').trigger('click')
    expect(wrapper.find('.cs-cinematic-ingredients-overlay').exists()).toBe(true)
  })

  it('lists ingredients inside the overlay when open', async () => {
    const wrapper = mountCinematic()
    await wrapper.find('.cs-cinematic-ingredients-btn').trigger('click')
    expect(wrapper.find('.cs-cinematic-ingredients-overlay').text()).toContain('500g ground beef')
  })

  it('intro slide has a "Begin" or "Swipe to begin" call-to-action', () => {
    const wrapper = mountCinematic()
    expect(wrapper.text().toLowerCase()).toMatch(/begin|swipe/i)
  })

  it('step text is rendered inside step slides', () => {
    const wrapper = mountCinematic()
    expect(wrapper.text()).toContain('Brown the ground beef')
    expect(wrapper.text()).toContain('Add tomato sauce')
  })
})
