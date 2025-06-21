import type { CardFormData, Card } from '~/types/schemas'

export const useCards = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const createCard = async (cardData: CardFormData) => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    const { data, error } = await $fetch('/api/cards', {
      method: 'POST',
      body: cardData
    })

    if (error) {
      throw new Error('Failed to create card')
    }

    return data
  }

  const getCards = async () => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    const { cards, error } = await $fetch('/api/cards')

    if (error) {
      throw new Error('Failed to fetch cards')
    }

    return cards
  }

  const getCard = async (id: string) => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    const { card, error } = await $fetch(`/api/cards/${id}`)

    if (error) {
      throw new Error('Failed to fetch card')
    }

    return card
  }

  const updateCard = async (id: string, cardData: CardFormData) => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    const { card, error } = await $fetch(`/api/cards/${id}`, {
      method: 'PUT',
      body: cardData
    })

    if (error) {
      throw new Error('Failed to update card')
    }

    return card
  }

  const deleteCard = async (id: string) => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    const { success, error } = await $fetch(`/api/cards/${id}`, {
      method: 'DELETE'
    })

    if (error) {
      throw new Error('Failed to delete card')
    }

    return success
  }

  return {
    createCard,
    getCards,
    getCard,
    updateCard,
    deleteCard
  }
}