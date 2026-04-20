/**
 * GET /api/v2/surveys/:surveyId/responses/draft?site_id=X
 * Returns the authenticated user's existing survey state:
 *   - `draft`: most recent INCOMPLETE response for resume (or null)
 *   - `completed`: most recent COMPLETED response (or null) — with `promotion` attached
 *     so the client can render the sticky success screen + Upgrade flow
 *
 * Only works for user-authed surveys (requires session). For public/anon surveys,
 * the client tracks drafts in localStorage.
 */
export default defineEventHandler(async (event) => {
  const surveyId = Number(getRouterParam(event, 'surveyId'))
  if (!surveyId || isNaN(surveyId)) {
    setResponseStatus(event, 400)
    return { error: 'Valid survey ID is required' }
  }

  const session = await getUserSession(event)
  if (!session?.user?.id) {
    setResponseStatus(event, 401)
    return { error: 'Authentication required' }
  }

  const query = getQuery(event)
  const siteId = query.site_id ? Number(query.site_id) : undefined

  const surveyRepo = new SurveyRepository()
  const [draft, completed, survey] = await Promise.all([
    surveyRepo.findDraftForUser(surveyId, session.user.id, siteId),
    surveyRepo.findCompletedForUser(surveyId, session.user.id, siteId),
    surveyRepo.findById(surveyId),
  ])

  return {
    success: true,
    draft: draft || null,
    completed: completed || null,
    // Promotion is only attached when the user has a completed response —
    // they've earned the right to see the discount code.
    promotion: completed && survey?.promotion ? survey.promotion : null,
  }
})
