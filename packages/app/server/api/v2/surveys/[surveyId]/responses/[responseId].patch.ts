/**
 * PATCH /api/v2/surveys/:surveyId/responses/:responseId
 * Update an existing response — typically called repeatedly as the user answers
 * each question (autosave), and one final time with { completed: true }.
 *
 * Auth rules:
 *   - user-authed surveys: the session's user must match the response's user_id
 *   - public/anon surveys: require the opaque draft_token returned at draft
 *     creation (in the `x-draft-token` header or the body). The response id
 *     alone is auto-increment and therefore enumerable, so it can't be trusted
 *     on its own.
 */
export default defineEventHandler(async (event) => {
  try {
    await rateLimitMiddleware(event, {
      maxRequests: 200,
      windowMs: 60 * 60 * 1000,
      keyPrefix: 'survey_patch:',
    })

    const surveyId = Number(getRouterParam(event, 'surveyId'))
    const responseId = Number(getRouterParam(event, 'responseId'))
    if (!surveyId || !responseId) {
      setResponseStatus(event, 400)
      return { error: 'Valid survey and response IDs are required' }
    }

    const surveyRepo = new SurveyRepository()
    const survey = await surveyRepo.findById(surveyId)
    if (!survey) {
      setResponseStatus(event, 404)
      return { error: 'Survey not found' }
    }

    const existing = await surveyRepo.findResponseById(responseId)
    if (!existing || existing.survey_id !== surveyId) {
      setResponseStatus(event, 404)
      return { error: 'Response not found' }
    }

    const body = await readBody(event)

    // For authed surveys, the caller must own this response
    if (survey.requires_auth) {
      const session = await getUserSession(event)
      if (!session?.user?.id || session.user.id !== existing.user_id) {
        setResponseStatus(event, 403)
        return { error: 'You do not have access to this response' }
      }
    } else {
      // Public surveys: the caller must present the draft_token they received
      // when the draft was created. Older drafts without a stored token can't
      // be updated — they predate this hardening and would otherwise be a hole.
      const providedToken = getRequestHeader(event, 'x-draft-token') || body?.draft_token
      if (!existing.draft_token || !providedToken || providedToken !== existing.draft_token) {
        setResponseStatus(event, 403)
        return { error: 'Missing or invalid draft token' }
      }
    }
    const updates: { response_data?: Record<string, any>; completed?: boolean; respondent_email?: string } = {}

    if (body.response_data !== undefined) {
      if (!body.response_data || typeof body.response_data !== 'object') {
        setResponseStatus(event, 400)
        return { error: 'response_data must be an object' }
      }
      updates.response_data = body.response_data
    }
    if (body.completed !== undefined) {
      updates.completed = !!body.completed
    }
    if (body.respondent_email !== undefined) {
      updates.respondent_email = body.respondent_email
    }

    // Only block the transition from draft → completed; re-saving an
    // already-completed response must not count twice.
    if (
      updates.completed === true
      && !existing.completed
      && await surveyRepo.isCapReached(surveyId, survey.max_completions)
    ) {
      setResponseStatus(event, 409)
      return SURVEY_CAP_EXHAUSTED_ERROR
    }

    const updated = await surveyRepo.updateResponse(responseId, updates)

    // If the caller asked to finalize, return the promotion info (for the thank-you screen)
    if (updates.completed) {
      return { success: true, response: updated, promotion: survey.promotion }
    }
    return { success: true, response: updated }
  } catch (error: any) {
    if (error.statusCode === 429) throw error
    return sendErrorResponse(event, error)
  }
})
