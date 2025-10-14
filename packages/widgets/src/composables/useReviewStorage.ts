interface ReviewData {
  id?: number
  type?: string
  review_title?: string
  creation: number | string
  review_content?: string
  author_email?: string
  author_name?: string
  rating: number | string
  edited_by_admin?: string | number
  edited_by_user?: string | number
  created?: number
  modified?: number
  handshake?: string
}

interface MVState {
  ratings: Record<string | number, ReviewData>
}

const KEY = 'mv_state'

/**
 * Returns full value of MV Store
 * @return {MVState | null}
 */
export const getLocalState = (): MVState | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(KEY)
    return stored ? JSON.parse(stored) : null
  } catch (err) {
    console.warn('Failed to parse MV state from localStorage:', err)
    return null
  }
}

/**
 * Caches review data
 * @param {Record<string | number, ReviewData>} data Object where keys are review IDs and values are review data
 * @return {ReviewData | null} Value of the first object passed
 */
export const setLocalState = (data: Record<string | number, ReviewData>): ReviewData | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const state = getLocalState() || { ratings: {} }
    const { ratings } = state
    const updatedRatings = { ...ratings, ...data }
    
    const newState: MVState = {
      ...state,
      ratings: updatedRatings,
    }
    
    localStorage.setItem(KEY, JSON.stringify(newState))
    
    // Return the first review data object
    const values = Object.values(data)
    return values.length > 0 ? values[0] : null
  } catch (err) {
    console.warn('Failed to save MV state to localStorage:', err)
    return null
  }
}

/**
 * Given creation id, get matching review from state
 * @param {number | string} id Creation ID
 * @return {ReviewData | null}
 */
export const getInitialState = (id: number | string): ReviewData | null => {
  const state = getLocalState()

  // If we don't have state or don't have ratings, return null
  if (!state || !state.ratings) {
    return null
  }

  // Get values of previous ratings
  const ratings = Object.values(state.ratings)

  // Get the rating that matches the id that we passed
  const rating = ratings.find(({ creation }) => creation == id) // eslint-disable-line eqeqeq

  // Only use the rating data if it has an active handshake
  if (rating && rating.handshake && rating.handshake.trim() !== "") {
    return rating
  }

  return null
}

/**
 * Generate a random handshake for new reviews
 * @return {string}
 */
export const generateHandshake = (): string => {
  return Math.ceil(Math.random() * 1000000).toString()
}

/**
 * Save review data to localStorage with automatic handshake generation
 * @param {ReviewData} reviewData Review data to save
 * @return {ReviewData | null}
 */
export const saveReviewData = (reviewData: ReviewData): ReviewData | null => {
  const existingReview = getInitialState(reviewData.creation)
  
  // If no existing review, generate handshake
  if (!existingReview && !reviewData.handshake) {
    reviewData.handshake = generateHandshake()
  }
  
  // Use existing handshake and ID if available
  if (existingReview?.handshake) {
    reviewData.handshake = existingReview.handshake
  }
  if (existingReview?.id) {
    reviewData.id = existingReview.id
  }
  
  // Add timestamps in Unix format to match MV state
  const now = Math.floor(Date.now() / 1000)
  reviewData.created = existingReview?.created || now
  reviewData.modified = now
  
  // Set type if not provided
  if (!reviewData.type) {
    reviewData.type = 'review'
  }
  
  // Use creation ID as the key in localStorage
  const dataToSave = { [reviewData.creation]: reviewData }
  
  return setLocalState(dataToSave)
}

/**
 * Composable for review storage management
 */
export const useReviewStorage = () => {
  return {
    getLocalState,
    setLocalState,
    getInitialState,
    generateHandshake,
    saveReviewData
  }
}