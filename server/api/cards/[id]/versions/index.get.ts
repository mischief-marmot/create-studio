import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { versioning } from '~/server/utils/versioning'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const cardId = getRouterParam(event, 'id')

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  if (!cardId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Card ID is required'
    })
  }

  // Verify card belongs to user
  const { data: card, error: cardError } = await supabase
    .from('cards')
    .select('id')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single()

  if (cardError || !card) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Card not found'
    })
  }

  // Get query parameters
  const query = getQuery(event)
  const limit = Number(query.limit) || 20

  // Fetch versions
  const versions = await versioning.getCardVersions(supabase, cardId, limit)
  const stats = await versioning.getVersionStats(supabase, cardId)

  return {
    versions,
    stats,
    pagination: {
      limit,
      total: stats?.totalVersions || 0
    }
  }
})