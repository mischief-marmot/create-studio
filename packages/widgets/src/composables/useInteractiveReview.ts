import { ref, reactive, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { getInitialState } from './useReviewStorage'
import { useReviewSubmission } from './useReviewSubmission'

interface Analytics {
  trackRatingEvent: (event: string, rating?: number) => void
}

interface Options {
  creationId: ComputedRef<string>
  siteUrl: ComputedRef<string>
  disableRatingSubmission: ComputedRef<boolean>
  analytics: Analytics
  imageHeight: Ref<number>
}

const ratingThreshold = 4

export function useInteractiveReview({
  creationId,
  siteUrl,
  disableRatingSubmission,
  analytics,
  imageHeight,
}: Options) {
  const currentRating = ref(0)
  const hasSubmittedRating = ref(false)
  const hasSubmittedReview = ref(false)
  const existingReview = ref<any>(null)

  const form = reactive({
    title: '',
    review: '',
    name: '',
    email: '',
  })

  const reviewSubmission = useReviewSubmission()

  const loadExistingReview = () => {
    if (creationId.value) {
      const existing = getInitialState(creationId.value)
      if (existing) {
        existingReview.value = existing
        currentRating.value = parseInt(existing.rating.toString())
        hasSubmittedRating.value = true
        hasSubmittedReview.value = !!(existing.review_content || existing.author_name)

        form.title = existing.review_title || ''
        form.review = existing.review_content || ''
        form.name = existing.author_name || ''
        form.email = existing.author_email || ''

        imageHeight.value = 10
      }
    }
  }

  const reviewQuestionText = computed(() => {
    if (currentRating.value === 0) {
      return 'How was it?'
    }
    return currentRating.value >= ratingThreshold ? '' : 'What went wrong?'
  })

  const showRatingSubmittedMessage = computed(() => {
    return currentRating.value >= ratingThreshold && hasSubmittedRating.value && !hasSubmittedReview.value
  })

  const showLowRatingPrompt = computed(() => {
    return currentRating.value > 0 && currentRating.value < ratingThreshold && !hasSubmittedReview.value
  })

  const showReviewForm = computed(() => {
    return currentRating.value > 0
  })

  const isFormRequired = computed(() => {
    return currentRating.value > 0 && currentRating.value < ratingThreshold
  })

  const isFormValid = computed(() => {
    if (!isFormRequired.value) return true
    const hasReview = /\S/.test(form.review)
    const hasName = /\S/.test(form.name)
    const hasEmail = /\S/.test(form.email)
    return hasReview && hasName && hasEmail
  })

  const handleRatingSelect = async (rating: number) => {
    currentRating.value = rating

    analytics.trackRatingEvent('submitted', rating)

    if (disableRatingSubmission.value) {
      hasSubmittedRating.value = true
      return
    }

    if (rating >= ratingThreshold && creationId.value && !hasSubmittedRating.value) {
      const result = await reviewSubmission.submit(
        {
          creation: creationId.value,
          rating,
          type: 'review',
        },
        siteUrl.value
      )

      if (result.ok) {
        hasSubmittedRating.value = true
      }
    }
  }

  const handleFormSubmit = async () => {
    if (!creationId.value) {
      console.warn('Cannot submit review: missing creation ID')
      return
    }

    if (disableRatingSubmission.value) {
      hasSubmittedReview.value = true
      hasSubmittedRating.value = true
      return
    }

    const reviewData = {
      creation: creationId.value,
      rating: currentRating.value,
      type: 'review',
      review_title: form.title.trim(),
      review_content: form.review.trim(),
      author_name: form.name.trim(),
      author_email: form.email.trim(),
    }

    const result = await reviewSubmission.submit(reviewData, siteUrl.value)

    if (result.ok) {
      hasSubmittedReview.value = true
      hasSubmittedRating.value = true
      loadExistingReview()
    } else {
      console.error('Review submission failed:', reviewSubmission.submissionError.value)
    }
  }

  return {
    currentRating,
    hasSubmittedRating,
    hasSubmittedReview,
    existingReview,
    form,
    reviewQuestionText,
    showRatingSubmittedMessage,
    showLowRatingPrompt,
    showReviewForm,
    isFormValid,
    handleRatingSelect,
    handleFormSubmit,
    loadExistingReview,
    reviewSubmission,
  }
}
