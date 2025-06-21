import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

interface CreateTemplateBody {
  name: string
  description?: string
  category?: string
  isPublic?: boolean
  templateData?: any
  fromCardId?: string
}

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody<CreateTemplateBody>(event)

  if (!body.name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Template name is required'
    })
  }

  try {
    let templateId: string

    if (body.fromCardId) {
      // Create template from existing card
      const { data, error } = await supabase.rpc('create_template_from_card', {
        card_id_param: body.fromCardId,
        template_name: body.name,
        template_description: body.description || null,
        template_category: body.category || null,
        is_public_param: body.isPublic || false
      })

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create template from card',
          data: error
        })
      }

      templateId = data
    } else {
      // Create template from scratch
      if (!body.templateData) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Template data is required when not creating from card'
        })
      }

      const { data, error } = await supabase
        .from('templates')
        .insert({
          user_id: user.id,
          name: body.name,
          description: body.description || null,
          category: body.category || null,
          template_data: body.templateData,
          is_public: body.isPublic || false
        })
        .select()
        .single()

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to create template',
          data: error
        })
      }

      templateId = data.id
    }

    // Fetch the created template
    const { data: template, error: fetchError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (fetchError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch created template',
        data: fetchError
      })
    }

    return { template }
  } catch (error) {
    console.error('Error creating template:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create template'
    })
  }
})