import { eq } from 'drizzle-orm'
import { useAdminDb, surveys } from '~~/server/utils/admin-db'

/**
 * DELETE /api/admin/surveys/:id
 * Delete a survey. CASCADE removes its SurveyResponses.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id || isNaN(id)) {
    throw createError({ statusCode: 400, message: 'Valid survey ID is required' })
  }

  const db = useAdminDb(event)

  const existing = await db.select().from(surveys).where(eq(surveys.id, id)).get()
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Survey not found' })
  }

  await db.delete(surveys).where(eq(surveys.id, id))

  return { success: true }
})
