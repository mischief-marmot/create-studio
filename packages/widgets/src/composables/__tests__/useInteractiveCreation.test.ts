import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed } from 'vue'
import { useInteractiveCreation } from '../useInteractiveCreation'

const mockCreation = {
  '@type': 'Recipe',
  name: 'Chocolate Cake',
  step: [
    { text: 'Mix flour and sugar', name: 'Step 1' },
    { text: 'Add eggs', name: 'Step 2' },
  ],
  recipeIngredient: ['2 cups flour', '1 cup sugar'],
}

describe('useInteractiveCreation', () => {
  beforeEach(() => {
    // Mock global fetch
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('initial state', () => {
    it('starts with no creation data', () => {
      const { creation } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })
      expect(creation.value).toBeNull()
    })

    it('starts not loading', () => {
      const { isLoadingCreation } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })
      expect(isLoadingCreation.value).toBe(false)
    })

    it('starts with no error', () => {
      const { creationError } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })
      expect(creationError.value).toBeNull()
    })

    it('dataReady is false initially (no creation)', () => {
      const { dataReady } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })
      expect(dataReady.value).toBe(false)
    })

    it('steps returns empty array when no creation', () => {
      const { steps } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })
      expect(steps.value).toEqual([])
    })
  })

  describe('loadCreationData', () => {
    it('sets isLoadingCreation to true while fetching, false when done', async () => {
      const resolveResponse = vi.fn()
      const fetchPromise = new Promise<void>((resolve) => { resolveResponse.value = resolve })

      vi.mocked(fetch).mockReturnValueOnce(
        fetchPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve(mockCreation),
        })) as any
      )

      const { isLoadingCreation, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      const loading = loadCreationData()
      expect(isLoadingCreation.value).toBe(true)
      resolveResponse.value()
      await loading
      expect(isLoadingCreation.value).toBe(false)
    })

    it('populates creation on successful fetch', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCreation),
      } as any)

      const { creation, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      await loadCreationData()
      expect(creation.value).toEqual(mockCreation)
    })

    it('sets dataReady to true after successful fetch', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCreation),
      } as any)

      const { dataReady, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      await loadCreationData()
      expect(dataReady.value).toBe(true)
    })

    it('sets creationError on fetch failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const { creationError, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      await loadCreationData()
      expect(creationError.value).toBeTruthy()
    })

    it('sets creationError on HTTP error response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({}),
      } as any)

      const { creationError, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      await loadCreationData()
      expect(creationError.value).toContain('404')
    })

    it('leaves isLoadingCreation false even on error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const { isLoadingCreation, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      await loadCreationData()
      expect(isLoadingCreation.value).toBe(false)
    })
  })

  describe('steps computed', () => {
    it('returns steps from creation after load', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCreation),
      } as any)

      const { steps, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      await loadCreationData()
      expect(steps.value).toHaveLength(2)
      expect(steps.value[0].text).toBe('Mix flour and sugar')
    })
  })

  describe('suppliesLabel computed', () => {
    it('returns "Ingredients" for Recipe type', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockCreation, '@type': 'Recipe' }),
      } as any)

      const { suppliesLabel, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      await loadCreationData()
      expect(suppliesLabel.value).toBe('Ingredients')
    })

    it('returns "Supplies" for HowTo type', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockCreation, '@type': 'HowTo' }),
      } as any)

      const { suppliesLabel, loadCreationData } = useInteractiveCreation({
        creationId: computed(() => '123'),
        siteUrl: computed(() => 'https://example.com'),
        baseUrl: computed(() => 'https://create.studio'),
        cacheBust: computed(() => false),
      })

      await loadCreationData()
      expect(suppliesLabel.value).toBe('Supplies')
    })
  })
})
