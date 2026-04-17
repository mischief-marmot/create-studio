import { eq, desc, sql } from 'drizzle-orm'
import { useAdminDb, surveys, surveyResponses } from '~~/server/utils/admin-db'

/**
 * GET /api/admin/surveys
 * Returns list of surveys with completed-response counts (single joined query).
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminDb(event)

  try {
    const rows = await db
      .select({
        id: surveys.id,
        slug: surveys.slug,
        title: surveys.title,
        description: surveys.description,
        status: surveys.status,
        requires_auth: surveys.requires_auth,
        createdAt: surveys.createdAt,
        updatedAt: surveys.updatedAt,
        response_count: sql<number>`COALESCE(SUM(CASE WHEN ${surveyResponses.completed} = 1 THEN 1 ELSE 0 END), 0)`.as('response_count'),
      })
      .from(surveys)
      .leftJoin(surveyResponses, eq(surveyResponses.survey_id, surveys.id))
      .groupBy(surveys.id)
      .orderBy(desc(surveys.createdAt))
      .all()

    return { data: rows }
  } catch (error) {
    console.error('Error fetching surveys:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch surveys' })
  }
})
