/**
 * POST /api/v2/surveys/:surveyId/responses
 * Public endpoint (rate-limited) — submit a survey response.
 * For user-authed surveys, requires a valid session and a site_id the user owns.
 */
export default defineEventHandler(async (event) => {
  try {
    await rateLimitMiddleware(event, {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'survey_response:',
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

    if (!body.response_data || typeof body.response_data !== 'object') {
      setResponseStatus(event, 400)
      return { error: 'response_data object is required' }
    }

    let userId: number | undefined = body.user_id || undefined
    let siteId: number | undefined = body.site_id || undefined
    let respondentEmail: string | undefined = body.respondent_email || undefined

    if (survey.requires_auth) {
      const session = await getUserSession(event)
      if (!session?.user?.id) {
        setResponseStatus(event, 401)
        return { error: 'Authentication required for this survey' }
      }

      if (!siteId || typeof siteId !== 'number') {
        setResponseStatus(event, 400)
        return { error: 'site_id is required for this survey' }
      }

      const siteUserRepo = new SiteUserRepository()
      const hasAccess = await siteUserRepo.isUserVerified(session.user.id, siteId)
      if (!hasAccess) {
        setResponseStatus(event, 403)
        return { error: 'You do not have access to this site' }
      }

      userId = session.user.id
      respondentEmail = respondentEmail || session.user.email
    }

    const response = await surveyRepo.addResponse({
      survey_id: surveyId,
      user_id: userId,
      site_id: siteId,
      respondent_email: respondentEmail,
      response_data: body.response_data,
      completed: body.completed ?? true,
    })

    setResponseStatus(event, 201)
    return {
      success: true,
      response_id: response.id,
      promotion: survey.promotion,
    }
  } catch (error: any) {
    if (error.statusCode === 429) throw error
    return sendErrorResponse(event, error)
  }
})
