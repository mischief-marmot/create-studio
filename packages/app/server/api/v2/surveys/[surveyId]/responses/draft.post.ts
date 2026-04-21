/**
 * POST /api/v2/surveys/:surveyId/responses/draft
 * Create (or return) a draft response for the current user + site.
 * Used when the respondent starts a survey so subsequent answers can be autosaved.
 *
 * For user-authed surveys: requires a session + site_id.
 * For public surveys: creates an anonymous draft. The client tracks the returned id in localStorage.
 */
export default defineEventHandler(async (event) => {
  try {
    await rateLimitMiddleware(event, {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000,
      keyPrefix: 'survey_draft:',
    })

    const surveyId = Number(getRouterParam(event, 'surveyId'))
    if (!surveyId || isNaN(surveyId)) {
      setResponseStatus(event, 400)
      return { error: 'Valid survey ID is required' }
    }

    const surveyRepo = new SurveyRepository()
    const survey = await surveyRepo.findById(surveyId)
    if (!survey || survey.status !== 'active') {
      setResponseStatus(event, 404)
      return { error: 'Survey not found or not active' }
    }

    const body = await readBody(event)
    // Never trust user_id/site_id from the body — derive from session for authed surveys,
    // leave null for public surveys.
    let userId: number | undefined
    let siteId: number | undefined
    let email: string | undefined

    if (survey.requires_auth) {
      const session = await getUserSession(event)
      if (!session?.user?.id) {
        setResponseStatus(event, 401)
        return { error: 'Authentication required' }
      }
      const bodySiteId = Number(body?.site_id)
      if (!bodySiteId || isNaN(bodySiteId)) {
        setResponseStatus(event, 400)
        return { error: 'site_id is required' }
      }
      const siteUserRepo = new SiteUserRepository()
      const hasAccess = await siteUserRepo.isUserVerified(session.user.id, bodySiteId)
      if (!hasAccess) {
        setResponseStatus(event, 403)
        return { error: 'You do not have access to this site' }
      }
      userId = session.user.id
      siteId = bodySiteId
      email = session.user.email

      // Reuse an existing draft if the user already started this survey for this site
      const existing = await surveyRepo.findDraftForUser(surveyId, userId, siteId)
      if (existing) {
        setResponseStatus(event, 200)
        return { success: true, response: existing }
      }
    }

    // Block new drafts once the cap is hit so a respondent doesn't start
    // something they'll never be able to finalize. Returning users with an
    // existing draft are already handled above and can still resume.
    if (await surveyRepo.isCapReached(surveyId, survey.max_completions)) {
      setResponseStatus(event, 409)
      return SURVEY_CAP_EXHAUSTED_ERROR
    }

    const created = await surveyRepo.addResponse({
      survey_id: surveyId,
      user_id: userId,
      site_id: siteId,
      respondent_email: email,
      response_data: {},
      completed: false,
    })

    setResponseStatus(event, 201)
    return { success: true, response: created }
  } catch (error: any) {
    if (error.statusCode === 429) throw error
    return sendErrorResponse(event, error)
  }
})
