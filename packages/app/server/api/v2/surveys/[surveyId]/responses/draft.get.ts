/**
 * GET /api/v2/surveys/:surveyId/responses/draft?site_id=X
 * Returns the authenticated user's most recent incomplete response for this
 * survey (+ optionally this site). Used on survey page load to enable Resume.
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
  const draft = await surveyRepo.findDraftForUser(surveyId, session.user.id, siteId)

  return {
    success: true,
    draft: draft || null,
  }
})
