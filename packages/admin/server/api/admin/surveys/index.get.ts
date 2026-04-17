import { eq, desc, count, and } from 'drizzle-orm'
import { useAdminDb, surveys, surveyResponses } from '~~/server/utils/admin-db'

/**
 * GET /api/admin/surveys
 * Returns list of surveys with response counts.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminDb(event)

  try {
    const allSurveys = await db
      .select()
      .from(surveys)
      .orderBy(desc(surveys.createdAt))
      .all()

    // Get response counts per survey
    const surveysWithCounts = await Promise.all(
      allSurveys.map(async (survey) => {
        const countResult = await db
          .select({ count: count() })
          .from(surveyResponses)
          .where(and(
            eq(surveyResponses.survey_id, survey.id),
            eq(surveyResponses.completed, true),
          ))
        return {
          ...survey,
          response_count: countResult[0]?.count || 0,
        }
      })
    )

    return { data: surveysWithCounts }
  } catch (error) {
    console.error('Error fetching surveys:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch surveys' })
  }
})
