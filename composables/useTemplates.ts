export interface Template {
  id: string
  user_id: string
  name: string
  description?: string
  category?: string
  tags: string[]
  template_data: any
  is_public: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface TemplateSearchOptions {
  search?: string
  category?: string
  includePublic?: boolean
  limit?: number
  offset?: number
}

export interface CreateTemplateOptions {
  name: string
  description?: string
  category?: string
  isPublic?: boolean
  templateData?: any
  fromCardId?: string
}

export const useTemplates = () => {
  const user = useSupabaseUser()

  const searchTemplates = async (options: TemplateSearchOptions = {}) => {
    const params = new URLSearchParams()
    
    if (options.search) params.append('search', options.search)
    if (options.category) params.append('category', options.category)
    if (options.includePublic !== undefined) params.append('public', options.includePublic.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.offset) params.append('offset', options.offset.toString())

    const { templates, pagination } = await $fetch(`/api/templates?${params}`)
    return { templates, pagination }
  }

  const getTemplates = async (options: TemplateSearchOptions = {}) => {
    return searchTemplates(options)
  }

  const createTemplate = async (options: CreateTemplateOptions) => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    const { template } = await $fetch('/api/templates', {
      method: 'POST',
      body: options
    })

    return template
  }

  const createTemplateFromCard = async (cardId: string, templateOptions: Omit<CreateTemplateOptions, 'fromCardId' | 'templateData'>) => {
    return createTemplate({
      ...templateOptions,
      fromCardId: cardId
    })
  }

  const useTemplate = async (templateId: string) => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    const { card, template } = await $fetch(`/api/templates/${templateId}/use`, {
      method: 'POST'
    })

    return { card, template }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!user.value) {
      throw new Error('User must be authenticated')
    }

    await $fetch(`/api/templates/${templateId}`, {
      method: 'DELETE'
    })

    return true
  }

  const getTemplateCategories = async () => {
    // Get distinct categories from templates
    const { templates } = await searchTemplates({ limit: 1000 })
    const categories = [...new Set(templates.map((t: Template) => t.category).filter(Boolean))]
    return categories.sort()
  }

  const getPopularTemplates = async (limit = 10) => {
    return searchTemplates({ limit, includePublic: true })
  }

  const getUserTemplates = async (limit = 20) => {
    return searchTemplates({ limit, includePublic: false })
  }

  return {
    searchTemplates,
    getTemplates,
    createTemplate,
    createTemplateFromCard,
    useTemplate,
    deleteTemplate,
    getTemplateCategories,
    getPopularTemplates,
    getUserTemplates
  }
}