import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { CardFormData } from '~/types/schemas'
import { cardsCache } from '~/server/utils/cache'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
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

  // Generate slug from title
  const slug = body.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  // Insert card
  const { data: cardData, error: cardError } = await supabase
    .from('cards')
    .insert({
      user_id: user.id,
      type: body.type,
      title: body.title,
      description: body.description || '',
      slug,
      image_url: body.image || null,
      prep_time: body.prepTime || null,
      cook_time: body.cookTime || null,
      total_time: body.totalTime || null,
      servings: body.servings || null,
      status: 'draft'
    })
    .select()
    .single()

  if (cardError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create card',
      data: cardError
    })
  }

  // Insert ingredients if provided
  if (body.ingredients && body.ingredients.length > 0) {
    for (let i = 0; i < body.ingredients.length; i++) {
      const ingredient = body.ingredients[i]
      if (ingredient.name) {
        // First, create or find the ingredient in the ingredients table
        let ingredientId
        
        // Try to find existing ingredient by name
        const { data: existingIngredient } = await supabase
          .from('ingredients')
          .select('id')
          .eq('name', ingredient.name.trim())
          .single()

        if (existingIngredient) {
          ingredientId = existingIngredient.id
        } else {
          // Create new ingredient
          const ingredientSlug = ingredient.name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()

          const { data: newIngredient, error: newIngredientError } = await supabase
            .from('ingredients')
            .insert({
              name: ingredient.name.trim(),
              slug: ingredientSlug
            })
            .select('id')
            .single()

          if (newIngredientError) {
            console.error('Failed to create ingredient:', newIngredientError)
            continue
          }
          ingredientId = newIngredient.id
        }

        // Link ingredient to card
        const { error: cardIngredientError } = await supabase
          .from('card_ingredients')
          .insert({
            card_id: cardData.id,
            ingredient_id: ingredientId,
            amount: ingredient.amount ? parseFloat(ingredient.amount) : null,
            unit: ingredient.unit || null,
            display_order: i
          })

        if (cardIngredientError) {
          console.error('Failed to link ingredient to card:', cardIngredientError)
        }
      }
    }
  }

  // Insert instructions if provided
  if (body.instructions && body.instructions.length > 0) {
    for (let i = 0; i < body.instructions.length; i++) {
      const instruction = body.instructions[i]
      if (instruction.text) {
        const { error: instructionError } = await supabase
          .from('instructions')
          .insert({
            card_id: cardData.id,
            step_number: i + 1,
            title: instruction.name || '',
            content: instruction.text
          })

        if (instructionError) {
          console.error('Failed to insert instruction:', instructionError)
        }
      }
    }
  }

  // Invalidate cache for user's cards list
  await cardsCache.invalidateUserCards(user.id)

  return { card: cardData }
})