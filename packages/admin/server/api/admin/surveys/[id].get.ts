import { eq, desc, count, and, sql } from 'drizzle-orm'
import { useAdminDb, surveys, surveyResponses, sites } from '~~/server/utils/admin-db'

/**
 * GET /api/admin/surveys/:id
 * Returns survey details with all responses, paginated.
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50)
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminDb(event)
  const id = Number(getRouterParam(event, 'id'))

  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Valid survey ID is required' })
  }

  try {
    const survey = await db
      .select()
      .from(surveys)
      .where(eq(surveys.id, id))
      .get()

    if (!survey) {
      throw createError({ statusCode: 404, message: 'Survey not found' })
    }

    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50))
    const offset = (page - 1) * limit

    const countResult = await db
      .select({ count: count() })
      .from(surveyResponses)
      .where(eq(surveyResponses.survey_id, id))

    const total = countResult[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    const completedCount = await db
      .select({ count: count() })
      .from(surveyResponses)
      .where(and(
        eq(surveyResponses.survey_id, id),
        eq(surveyResponses.completed, true),
      ))

    const responses = await db
      .select({
        id: surveyResponses.id,
        survey_id: surveyResponses.survey_id,
        user_id: surveyResponses.user_id,
        site_id: surveyResponses.site_id,
        respondent_email: surveyResponses.respondent_email,
        response_data: surveyResponses.response_data,
        completed: surveyResponses.completed,
        createdAt: surveyResponses.createdAt,
        site_name: sites.name,
        site_url: sites.url,
      })
      .from(surveyResponses)
      .leftJoin(sites, eq(surveyResponses.site_id, sites.id))
      .where(eq(surveyResponses.survey_id, id))
      .orderBy(desc(surveyResponses.createdAt))
      .limit(limit)
      .offset(offset)
      .all()

    // Compute NPS from all completed responses with nps_score
    const allCompleted = await db
      .select({ response_data: surveyResponses.response_data })
      .from(surveyResponses)
      .where(and(
        eq(surveyResponses.survey_id, id),
        eq(surveyResponses.completed, true),
      ))
      .all()

    const npsScores = allCompleted
      .map(r => (r.response_data as any)?.nps_score)
      .filter((s): s is number => typeof s === 'number')

    const promoters = npsScores.filter(s => s >= 9).length
    const detractors = npsScores.filter(s => s < 7).length
    const npsTotal = npsScores.length || 1
    const npsScore = Math.round(((promoters - detractors) / npsTotal) * 100)
    const npsAverage = npsScores.length
      ? (npsScores.reduce((a, b) => a + b, 0) / npsScores.length).toFixed(1)
      : null

    return {
      survey,
      stats: {
        total,
        completed: completedCount[0]?.count || 0,
        nps: {
          score: npsScore,
          average: npsAverage,
          promoters,
          passives: npsScores.filter(s => s >= 7 && s < 9).length,
          detractors,
          total: npsScores.length,
        },
      },
      responses,
      pagination: { page, limit, total, totalPages },
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('Error fetching survey details:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch survey details' })
  }
})
