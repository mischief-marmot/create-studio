import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { cardsCache } from '~/server/utils/cache'

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

  try {
    // Call the restore function
    const { data: restorationVersionId, error: restoreError } = await supabase.rpc('restore_card_to_version', {
      target_card_id: cardId,
      target_version_number: versionNumber,
      user_id_param: user.id
    })

    if (restoreError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to restore version',
        data: restoreError
      })
    }

    // Invalidate cache after restoration
    await cardsCache.invalidateCardCaches(cardId, user.id)

    return {
      success: true,
      restorationVersionId,
      message: `Card restored to version ${versionNumber}`
    }
  } catch (error) {
    console.error('Error restoring card version:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to restore card version'
    })
  }
})