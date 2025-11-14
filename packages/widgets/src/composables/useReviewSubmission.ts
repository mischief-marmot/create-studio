import { ref, readonly } from 'vue'
import { getInitialState, saveReviewData } from './useReviewStorage'

interface ReviewSubmissionData {
  creation: number | string
  rating: number | string
  type?: string
  review_title?: string
  review_content?: string
  author_name?: string
  author_email?: string
  handshake?: string
  edited_by_user?: number | string
}

interface SubmissionResponse {
  ok: boolean
  data?: any
  error?: string
  statusCode?: number
}

/**
 * Submit a review to the WordPress API
 * @param {ReviewSubmissionData} data Review data to submit
 * @param {string} siteUrl Base URL of the WordPress site
 * @return {Promise<SubmissionResponse>}
 */
export const submitReview = async (
  data: ReviewSubmissionData,
  siteUrl: string
): Promise<SubmissionResponse> => {
  try {
    // Validate required data
    if (!data.creation) {
      console.warn('No creation provided')
      return { ok: false, error: 'Creation ID is required' }
    }
    if (!data.rating) {
      console.warn('No rating provided')
      return { ok: false, error: 'Rating is required' }
    }

    // Get existing review data from localStorage
    const prevReview = getInitialState(data.creation)

    // Add random handshake if we don't have one from previous review
    if (!prevReview?.handshake && !data.handshake) {
      data.handshake = Math.ceil(Math.random() * 1000000).toString()
    }

    // If previous review exists, use its handshake
    if (prevReview?.handshake) {
      data.handshake = prevReview.handshake
    }

    // Construct API endpoint
    const endpoint = prevReview?.id 
      ? `${siteUrl}/wp-json/mv-create/v1/reviews/${prevReview.id}`
      : `${siteUrl}/wp-json/mv-create/v1/reviews`

    // Prepare request data
    const requestData = prevReview?.id 
      ? { ...data, edited_by_user: 1 } // Update existing review
      : data // Create new review

    // Make the API request
    const response = await $fetch(endpoint, {
      method: 'POST',
      body: requestData,
      headers: {
        'Content-Type': 'application/json',
      }
    })

    // Save successful response to localStorage using MV state structure
    const reviewData = {
      ...data,
      id: response.id || prevReview?.id,
      created: prevReview?.created || Math.floor(Date.now() / 1000),
      modified: Math.floor(Date.now() / 1000),
      type: data.type || 'review',
      edited_by_admin: '0',
      edited_by_user: prevReview?.id ? '1' : '0'
    }
    
    saveReviewData(reviewData)

    return {
      ok: true,
      data: response
    }
  } catch (error: any) {
    console.error('Review submission error:', error)
    
    return {
      ok: false,
      error: error.message || 'Failed to submit review',
      statusCode: error.statusCode || error.status || 500
    }
  }
}

/**
 * Composable for review submission management
 */
export const useReviewSubmission = () => {
  const isSubmitting = ref(false)
  const submissionError = ref<string | null>(null)
  const lastSubmission = ref<any>(null)

  const submit = async (
    reviewData: ReviewSubmissionData,
    siteUrl: string
  ): Promise<SubmissionResponse> => {
    isSubmitting.value = true
    submissionError.value = null

    try {
      const result = await submitReview(reviewData, siteUrl)
      
      if (result.ok) {
        lastSubmission.value = result.data
        submissionError.value = null
      } else {
        submissionError.value = result.error || 'Submission failed'
      }

      return result
    } finally {
      isSubmitting.value = false
    }
  }

  const reset = () => {
    isSubmitting.value = false
    submissionError.value = null
    lastSubmission.value = null
  }

  return {
    isSubmitting: readonly(isSubmitting),
    submissionError: readonly(submissionError),
    lastSubmission: readonly(lastSubmission),
    submit,
    reset,
    submitReview // Export direct function for advanced usage
  }
}