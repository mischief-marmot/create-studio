import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { versioning } from '~/server/utils/versioning'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const cardId = getRouterParam(event, 'id')
  const versionNumber = Number(getRouterParam(event, 'version'))

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

  if (!versionNumber || isNaN(versionNumber)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid version number is required'
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

  // Fetch specific version
  const version = await versioning.getVersion(supabase, cardId, versionNumber)

  if (!version) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Version not found'
    })
  }

  return { version }
})