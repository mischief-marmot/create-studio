import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { CardFormData } from '~/types/schemas'
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

  const body = await readBody<CardFormData>(event)

  // Validate required fields
  if (!body.title || !body.type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title and type are required'
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

  // Generate slug from title
  const slug = body.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  // Update card
  const { data: cardData, error: cardError } = await supabase
    .from('cards')
    .update({
      type: body.type,
      title: body.title,
      description: body.description || '',
      slug,
      image_url: body.image || null,
      prep_time: body.prepTime || null,
      cook_time: body.cookTime || null,
      total_time: body.totalTime || null,
      servings: body.servings || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', cardId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (cardError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update card',
      data: cardError
    })
  }

  // Update ingredients (delete existing and insert new)
  await supabase
    .from('card_ingredients')
    .delete()
    .eq('card_id', cardId)

  if (body.ingredients && body.ingredients.length > 0) {
    for (const ingredient of body.ingredients) {
      if (ingredient.name) {
        await supabase
          .from('card_ingredients')
          .insert({
            card_id: cardId,
            name: ingredient.name,
            amount: ingredient.amount || null,
            unit: ingredient.unit || null,
            order_index: body.ingredients.indexOf(ingredient)
          })
      }
    }
  }

  // Update instructions (delete existing and insert new)
  await supabase
    .from('instructions')
    .delete()
    .eq('card_id', cardId)

  if (body.instructions && body.instructions.length > 0) {
    for (const instruction of body.instructions) {
      if (instruction.text) {
        await supabase
          .from('instructions')
          .insert({
            card_id: cardId,
            name: instruction.name || '',
            text: instruction.text,
            order_index: body.instructions.indexOf(instruction)
          })
      }
    }
  }

  // Invalidate cache for both the specific card and user's cards list
  await cardsCache.invalidateCardCaches(cardId, user.id)

  return { card: cardData }
})