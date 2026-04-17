/**
 * GET /api/v2/surveys/:surveyId/responses
 * Admin-only endpoint — list all responses for a survey
 */
export default defineEventHandler(async (event) => {
  try {
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      setResponseStatus(event, 401)
      return { error: 'Authentication required' }
    }

    const surveyId = Number(getRouterParam(event, 'surveyId'))
    if (!surveyId || isNaN(surveyId)) {
      setResponseStatus(event, 400)
      return { error: 'Valid survey ID is required' }
    }

    const surveyRepo = new SurveyRepository()
    const survey = await surveyRepo.findById(surveyId)

    if (!survey) {
      setResponseStatus(event, 404)
      return { error: 'Survey not found' }
    }

    const responses = await surveyRepo.getResponses(surveyId)
    const count = await surveyRepo.getResponseCount(surveyId)

    return {
      success: true,
      survey: {
        id: survey.id,
        slug: survey.slug,
        title: survey.title,
        status: survey.status,
      },
      total: count,
      responses,
    }
  } catch (error: any) {
    return sendErrorResponse(event, error)
  }
})
