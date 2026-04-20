/**
 * POST /api/_dev/seed-survey
 * Dev-only endpoint to seed the April 2026 publisher survey
 */
import { aprilSurveyDefinition, aprilSurveyPromotion } from '../../db/seeds/april-2026-survey'

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) {
    setResponseStatus(event, 404)
    return { error: 'Not found' }
  }

  const surveyRepo = new SurveyRepository()

  const existing = await surveyRepo.findBySlug('april-2026')
  if (existing) {
    await surveyRepo.update(existing.id, {
      definition: aprilSurveyDefinition,
      promotion: aprilSurveyPromotion,
    })
    return { success: true, message: 'Survey definition + promotion updated', survey_id: existing.id }
  }

  const survey = await surveyRepo.create({
    slug: 'april-2026',
    title: 'Create Publisher Survey — April 2026',
    description: 'Help shape the next chapter of Create. 5–10 minutes. Finish to unlock 50% off your first year of Create Pro.',
    definition: aprilSurveyDefinition,
    status: 'active',
    promotion: aprilSurveyPromotion,
  })

  return { success: true, message: 'Survey seeded', survey_id: survey.id }
})
