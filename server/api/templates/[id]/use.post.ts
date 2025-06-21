import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { CardFormData } from '~/types/schemas'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const templateId = getRouterParam(event, 'id')

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  if (!templateId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Template ID is required'
    })
  }

  try {
    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Template not found'
      })
    }

    // Check access (user's own template or public template)
    if (template.user_id !== user.id && !template.is_public) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    // Convert template data to card format
    const templateData = template.template_data
    const cardData: Partial<CardFormData> = {
      type: templateData.type || 'Recipe',
      title: templateData.title || '',
      description: templateData.description || '',
      image: templateData.image_url || null,
      ingredients: templateData.ingredients?.map((ing: any) => ({
        name: ing.name,
        amount: ing.amount?.toString() || '',
        unit: ing.unit || ''
      })) || [],
      instructions: templateData.instructions?.map((inst: any) => ({
        name: inst.title || '',
        text: inst.content
      })) || [],
      prepTime: templateData.prep_time,
      cookTime: templateData.cook_time,
      totalTime: templateData.total_time,
      servings: templateData.servings
    }

    // Create new card from template
    const { data: cardResponse, error: cardError } = await $fetch('/api/cards', {
      method: 'POST',
      body: {
        ...cardData,
        title: `${templateData.title || 'New Card'} (from template)`,
        description: `${templateData.description || ''}\n\nCreated from template: ${template.name}`
      },
      headers: {
        'Authorization': event.node.req.headers.authorization || ''
      }
    })

    if (cardError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create card from template',
        data: cardError
      })
    }

    // Record template usage
    await supabase.rpc('increment_template_usage', {
      template_id_param: templateId,
      user_id_param: user.id,
      card_id_param: cardResponse.card.id
    })

    return {
      card: cardResponse.card,
      template: {
        id: template.id,
        name: template.name
      }
    }
  } catch (error) {
    console.error('Error using template:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to use template'
    })
  }
})