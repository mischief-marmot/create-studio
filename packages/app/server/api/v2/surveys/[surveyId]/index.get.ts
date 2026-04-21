/**
 * GET /api/v2/surveys/:surveyId
 * Public endpoint — fetch an active survey by slug OR numeric id.
 * The route param `:surveyId` is shared with sibling routes under this folder
 * so Nitro's radix tree registers one dynamic child at this level (not two).
 *
 * For user-authed surveys, also signals whether the caller is logged in.
 */
export default defineEventHandler(async (event) => {
  const param = getRouterParam(event, 'surveyId')
  if (!param) {
    setResponseStatus(event, 400)
    return { error: 'Survey id or slug is required' }
  }

  const surveyRepo = new SurveyRepository()
  // Accept either a numeric id or a slug
  const asNumber = Number(param)
  const survey = !isNaN(asNumber) && /^\d+$/.test(param)
    ? await surveyRepo.findById(asNumber)
    : await surveyRepo.findBySlug(param)

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

  // When a completion cap is set, compute the live remaining count so the
  // public page can render urgency messaging ("only 13 spots left!") and
  // switch into a closed state once the cap is hit.
  let max_completions: number | null = null
  let spots_remaining: number | null = null
  if (survey.max_completions != null) {
    max_completions = survey.max_completions
    const completed = await surveyRepo.getResponseCount(survey.id)
    spots_remaining = Math.max(0, max_completions - completed)
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
      max_completions,
      spots_remaining,
    },
    authenticated,
  }
})
