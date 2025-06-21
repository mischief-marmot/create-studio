import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
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

  // Try to get from cache first
  const cachedCards = await cardsCache.getUserCards(user.id)
  if (cachedCards) {
    return { cards: cachedCards }
  }

  // Cache miss - fetch from database
  const { data, error } = await supabase
    .from('cards')
    .select(`
      id,
      type,
      title,
      description,
      slug,
      status,
      image_url,
      prep_time,
      cook_time,
      total_time,
      servings,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch cards',
      data: error
    })
  }

  const cards = data || []
  
  // Cache the result
  await cardsCache.setUserCards(user.id, cards)

  return { cards }
})