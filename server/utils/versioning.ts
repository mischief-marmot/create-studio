import type { SupabaseClient } from '@supabase/supabase-js'

export interface CardVersion {
  id: string
  card_id: string
  version_number: number
  change_type: 'created' | 'updated' | 'published' | 'archived' | 'restored'
  change_summary?: string
  card_data: any
  created_by: string
  created_at: string
}

export interface VersioningOptions {
  changeType?: string
  changeSummary?: string
  userId?: string
}

export const versioning = {
  /**
   * Create a version snapshot of a card
   */
  async createSnapshot(
    supabase: SupabaseClient,
    cardId: string,
    options: VersioningOptions = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('create_card_version_snapshot', {
        target_card_id: cardId,
        change_type_param: options.changeType || 'updated',
        change_summary_param: options.changeSummary || null,
        user_id_param: options.userId || null
      })

      if (error) {
        console.error('Failed to create version snapshot:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error creating version snapshot:', error)
      return null
    }
  },

  /**
   * Get all versions for a card
   */
  async getCardVersions(
    supabase: SupabaseClient,
    cardId: string,
    limit: number = 20
  ): Promise<CardVersion[]> {
    try {
      const { data, error } = await supabase
        .from('card_versions')
        .select('*')
        .eq('card_id', cardId)
        .order('version_number', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch card versions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching card versions:', error)
      return []
    }
  },

  /**
   * Get a specific version
   */
  async getVersion(
    supabase: SupabaseClient,
    cardId: string,
    versionNumber: number
  ): Promise<CardVersion | null> {
    try {
      const { data, error } = await supabase
        .from('card_versions')
        .select('*')
        .eq('card_id', cardId)
        .eq('version_number', versionNumber)
        .single()

      if (error) {
        console.error('Failed to fetch version:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching version:', error)
      return null
    }
  },

  /**
   * Compare two versions and return differences
   */
  compareVersions(version1: CardVersion, version2: CardVersion) {
    const changes: Array<{
      field: string
      oldValue: any
      newValue: any
      type: 'added' | 'removed' | 'modified'
    }> = []

    const data1 = version1.card_data
    const data2 = version2.card_data

    // Compare basic card fields
    const basicFields = ['title', 'description', 'type', 'status', 'prep_time', 'cook_time', 'servings']
    
    for (const field of basicFields) {
      if (data1[field] !== data2[field]) {
        changes.push({
          field,
          oldValue: data1[field],
          newValue: data2[field],
          type: 'modified'
        })
      }
    }

    // Compare arrays (ingredients, instructions, etc.)
    const arrayFields = ['ingredients', 'instructions', 'supplies']
    
    for (const field of arrayFields) {
      const arr1 = data1[field] || []
      const arr2 = data2[field] || []
      
      if (JSON.stringify(arr1) !== JSON.stringify(arr2)) {
        changes.push({
          field,
          oldValue: arr1.length,
          newValue: arr2.length,
          type: arr1.length === arr2.length ? 'modified' : (arr1.length < arr2.length ? 'added' : 'removed')
        })
      }
    }

    return changes
  },

  /**
   * Create a summary of changes between versions
   */
  generateChangeSummary(changes: ReturnType<typeof versioning.compareVersions>): string {
    if (changes.length === 0) return 'No changes detected'

    const summaryParts: string[] = []

    const groupedChanges = changes.reduce((acc, change) => {
      if (!acc[change.type]) acc[change.type] = []
      acc[change.type].push(change)
      return acc
    }, {} as Record<string, typeof changes>)

    if (groupedChanges.modified) {
      const fields = groupedChanges.modified.map(c => c.field).join(', ')
      summaryParts.push(`Modified: ${fields}`)
    }

    if (groupedChanges.added) {
      const fields = groupedChanges.added.map(c => c.field).join(', ')
      summaryParts.push(`Added: ${fields}`)
    }

    if (groupedChanges.removed) {
      const fields = groupedChanges.removed.map(c => c.field).join(', ')
      summaryParts.push(`Removed: ${fields}`)
    }

    return summaryParts.join('; ')
  },

  /**
   * Get version statistics for a card
   */
  async getVersionStats(
    supabase: SupabaseClient,
    cardId: string
  ): Promise<{
    totalVersions: number
    latestVersion: number
    firstCreated: string
    lastModified: string
  } | null> {
    try {
      const { data, error } = await supabase
        .from('card_versions')
        .select('version_number, created_at')
        .eq('card_id', cardId)
        .order('version_number', { ascending: false })

      if (error) {
        console.error('Failed to fetch version stats:', error)
        return null
      }

      if (!data || data.length === 0) {
        return null
      }

      return {
        totalVersions: data.length,
        latestVersion: data[0].version_number,
        firstCreated: data[data.length - 1].created_at,
        lastModified: data[0].created_at
      }
    } catch (error) {
      console.error('Error fetching version stats:', error)
      return null
    }
  }
}