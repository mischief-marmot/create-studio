import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)
  const query = getQuery(event)

  // Extract query parameters
  const search = query.search as string || null
  const category = query.category as string || null
  const includePublic = query.public !== 'false' // Default to true
  const limit = Math.min(Number(query.limit) || 20, 100) // Max 100
  const offset = Number(query.offset) || 0

  try {
    // Use the search function for more sophisticated filtering
    const { data: templates, error } = await supabase.rpc('search_templates', {
      search_query: search,
      category_filter: category,
      include_public: includePublic,
      user_id_param: user?.id || null,
      limit_param: limit,
      offset_param: offset
    })

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch templates',
        data: error
      })
    }

    // Get total count for pagination
    let totalCount = 0
    if (templates.length > 0) {
      const { count, error: countError } = await supabase
        .from('templates')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', includePublic || undefined)

      if (!countError) {
        totalCount = count || 0
      }
    }

    return {
      templates: templates || [],
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: (templates?.length || 0) === limit
      }
    }
  } catch (error) {
    console.error('Error fetching templates:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch templates'
    })
  }
})