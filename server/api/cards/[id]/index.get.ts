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

  // Try to get from cache first
  const cachedCard = await cardsCache.getCard(cardId)
  if (cachedCard && cachedCard.user_id === user.id) {
    return { card: cachedCard }
  }

  // Cache miss - fetch card with related data
  const { data: cardData, error: cardError } = await supabase
    .from('cards')
    .select(`
      *,
      card_ingredients (
        id,
        amount,
        unit,
        notes,
        optional,
        group_name,
        display_order,
        ingredients (
          id,
          name,
          category
        )
      ),
      instructions (
        id,
        step_number,
        title,
        content,
        duration
      ),
      card_supplies (
        id,
        notes,
        optional,
        display_order,
        supplies (
          id,
          name,
          category
        )
      ),
      nutrition_info (
        calories,
        protein_grams,
        carbs_grams,
        fat_grams,
        fiber_grams,
        sugar_grams,
        sodium_mg
      )
    `)
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single()

  if (cardError) {
    if (cardError.code === 'PGRST116') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Card not found'
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch card',
      data: cardError
    })
  }

  // Sort related data by display_order/step_number
  if (cardData.card_ingredients) {
    cardData.card_ingredients.sort((a, b) => a.display_order - b.display_order)
  }
  if (cardData.instructions) {
    cardData.instructions.sort((a, b) => a.step_number - b.step_number)
  }
  if (cardData.card_supplies) {
    cardData.card_supplies.sort((a, b) => a.display_order - b.display_order)
  }

  // Cache the result
  await cardsCache.setCard(cardId, cardData)

  return { card: cardData }
})