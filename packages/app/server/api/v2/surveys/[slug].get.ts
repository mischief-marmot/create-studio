/**
 * GET /api/v2/surveys/:slug
 * Public endpoint — fetch an active survey by slug.
 * For user-authed surveys, also signals whether the caller is logged in.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    setResponseStatus(event, 400)
    return { error: 'Survey slug is required' }
  }

  const surveyRepo = new SurveyRepository()
  const survey = await surveyRepo.findBySlug(slug)

  if (!survey) {
    setResponseStatus(event, 404)
    return { error: 'Survey not found' }
  }

  if (survey.status !== 'active') {
    setResponseStatus(event, 404)
    return { error: 'Survey is not currently active' }
  }

  // If the survey requires auth, surface the caller's session state so the
  // client can render a login prompt or proceed with site selection.
  let authenticated = false
  if (survey.requires_auth) {
    const session = await getUserSession(event)
    authenticated = !!session?.user?.id
  }

  return {
    success: true,
    survey: {
      id: survey.id,
      slug: survey.slug,
      title: survey.title,
      description: survey.description,
      definition: survey.definition,
      // NOTE: `survey.promotion` is intentionally omitted here — the discount code
      // is only revealed by the completion PATCH so it can't be scraped pre-submit.
      requires_auth: !!survey.requires_auth,
    },
    authenticated,
  }
})
