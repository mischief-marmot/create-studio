import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'
import { useInteractiveReview } from '../useInteractiveReview'

// Mock review storage and submission
vi.mock('../useReviewStorage', () => ({
  getInitialState: vi.fn(() => null),
}))

vi.mock('../useReviewSubmission', () => ({
  useReviewSubmission: vi.fn(() => ({
    submit: vi.fn(async () => ({ ok: true })),
    isSubmitting: ref(false),
    submissionError: ref(null),
    reset: vi.fn(),
  })),
}))

describe('useInteractiveReview', () => {
  describe('initial state', () => {
    it('currentRating starts at 0', () => {
      const { currentRating } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      expect(currentRating.value).toBe(0)
    })

    it('hasSubmittedRating starts false', () => {
      const { hasSubmittedRating } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      expect(hasSubmittedRating.value).toBe(false)
    })

    it('hasSubmittedReview starts false', () => {
      const { hasSubmittedReview } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      expect(hasSubmittedReview.value).toBe(false)
    })
  })

  describe('reviewQuestionText', () => {
    it('shows "How was it?" when rating is 0', () => {
      const { reviewQuestionText } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      expect(reviewQuestionText.value).toBe('How was it?')
    })

    it('shows empty string for high ratings (>= 4)', () => {
      const { currentRating, reviewQuestionText } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      currentRating.value = 5
      expect(reviewQuestionText.value).toBe('')
    })

    it('shows "What went wrong?" for low ratings (< 4)', () => {
      const { currentRating, reviewQuestionText } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      currentRating.value = 2
      expect(reviewQuestionText.value).toBe('What went wrong?')
    })
  })

  describe('showReviewForm', () => {
    it('is false when rating is 0', () => {
      const { showReviewForm } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      expect(showReviewForm.value).toBe(false)
    })

    it('is true when rating > 0', () => {
      const { currentRating, showReviewForm } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      currentRating.value = 3
      expect(showReviewForm.value).toBe(true)
    })
  })

  describe('showRatingSubmittedMessage', () => {
    it('is true for high rating that has been submitted without full review', () => {
      const { currentRating, hasSubmittedRating, hasSubmittedReview, showRatingSubmittedMessage } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      currentRating.value = 5
      hasSubmittedRating.value = true
      hasSubmittedReview.value = false
      expect(showRatingSubmittedMessage.value).toBe(true)
    })

    it('is false when review has been submitted', () => {
      const { currentRating, hasSubmittedRating, hasSubmittedReview, showRatingSubmittedMessage } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      currentRating.value = 5
      hasSubmittedRating.value = true
      hasSubmittedReview.value = true
      expect(showRatingSubmittedMessage.value).toBe(false)
    })

    it('is false for low rating', () => {
      const { currentRating, hasSubmittedRating, showRatingSubmittedMessage } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      currentRating.value = 2
      hasSubmittedRating.value = true
      expect(showRatingSubmittedMessage.value).toBe(false)
    })
  })

  describe('showLowRatingPrompt', () => {
    it('is true for low rating before submitting review', () => {
      const { currentRating, hasSubmittedReview, showLowRatingPrompt } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      currentRating.value = 2
      hasSubmittedReview.value = false
      expect(showLowRatingPrompt.value).toBe(true)
    })

    it('is false when review has been submitted', () => {
      const { currentRating, hasSubmittedReview, showLowRatingPrompt } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      currentRating.value = 2
      hasSubmittedReview.value = true
      expect(showLowRatingPrompt.value).toBe(false)
    })

    it('is false when rating is 0', () => {
      const { showLowRatingPrompt } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      expect(showLowRatingPrompt.value).toBe(false)
    })
  })

  describe('handleRatingSelect', () => {
    it('sets currentRating', async () => {
      const { currentRating, handleRatingSelect } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => true), // disable to skip API call
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      await handleRatingSelect(4)
      expect(currentRating.value).toBe(4)
    })

    it('tracks rating event in analytics', async () => {
      const trackRatingEvent = vi.fn()
      const { handleRatingSelect } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => true),
        analytics: { trackRatingEvent } as any,
        imageHeight: ref(25),
      })
      await handleRatingSelect(5)
      expect(trackRatingEvent).toHaveBeenCalledWith('submitted', 5)
    })

    it('sets hasSubmittedRating when submission is disabled (demo mode)', async () => {
      const { hasSubmittedRating, handleRatingSelect } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => true),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      await handleRatingSelect(5)
      expect(hasSubmittedRating.value).toBe(true)
    })
  })

  describe('form', () => {
    it('exposes a reactive form object', () => {
      const { form } = useInteractiveReview({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        disableRatingSubmission: computed(() => false),
        analytics: { trackRatingEvent: vi.fn() } as any,
        imageHeight: ref(25),
      })
      expect(form.title).toBe('')
      expect(form.review).toBe('')
      expect(form.name).toBe('')
      expect(form.email).toBe('')
    })
  })
})
