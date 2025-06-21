import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { cardsCache } from '~/server/utils/cache'

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

  // Check if card exists and belongs to user
  const { data: existingCard, error: checkError } = await supabase
    .from('cards')
    .select('id')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single()

  if (checkError || !existingCard) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Card not found'
    })
  }

  // Delete related data first (due to foreign key constraints)
  await Promise.all([
    supabase.from('card_ingredients').delete().eq('card_id', cardId),
    supabase.from('instructions').delete().eq('card_id', cardId),
    supabase.from('card_supplies').delete().eq('card_id', cardId),
    supabase.from('nutrition_info').delete().eq('card_id', cardId),
    supabase.from('affiliate_products').delete().eq('card_id', cardId)
  ])

  // Delete the card
  const { error: deleteError } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', user.id)

  if (deleteError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete card',
      data: deleteError
    })
  }

  // Invalidate cache for both the specific card and user's cards list
  await cardsCache.invalidateCardCaches(cardId, user.id)

  return { success: true }
})