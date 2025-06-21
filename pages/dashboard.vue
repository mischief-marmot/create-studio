<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <h1 class="text-xl font-bold">Recipe Card Generator</h1>
      </div>
      <div class="navbar-end">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full">
              <img 
                :src="user?.user_metadata?.avatar_url || '/placeholder-avatar.png'" 
                :alt="user?.user_metadata?.full_name || 'User'"
              />
            </div>
          </div>
          <ul tabindex="0" class="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
            <li><a @click="navigateTo('/profile')">Profile</a></li>
            <li><a @click="handleLogout">Logout</a></li>
          </ul>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h2 class="text-3xl font-bold mb-2">Welcome back, {{ user?.user_metadata?.full_name || 'User' }}!</h2>
        <p class="text-base-content/70">Create and manage your recipe cards</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div class="stat bg-base-100 shadow">
          <div class="stat-title">Total Cards</div>
          <div class="stat-value">{{ cards.length }}</div>
          <div class="stat-desc">Your recipe cards</div>
        </div>
        <div class="stat bg-base-100 shadow">
          <div class="stat-title">Published</div>
          <div class="stat-value">{{ publishedCards }}</div>
          <div class="stat-desc">Live cards</div>
        </div>
        <div class="stat bg-base-100 shadow">
          <div class="stat-title">Drafts</div>
          <div class="stat-value">{{ draftCards }}</div>
          <div class="stat-desc">Work in progress</div>
        </div>
      </div>

      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold">Your Cards</h3>
        <button class="btn btn-primary" @click="createNewCard">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Card
        </button>
      </div>

      <!-- Search and Filters -->
      <div class="card bg-base-100 shadow-sm mb-6">
        <div class="card-body py-4">
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Search Input -->
            <div class="form-control flex-1">
              <div class="input-group">
                <input 
                  v-model="searchQuery"
                  type="text" 
                  placeholder="Search cards by title or description..." 
                  class="input input-bordered flex-1" 
                />
                <button class="btn btn-square btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Type Filter -->
            <div class="form-control">
              <select v-model="selectedType" class="select select-bordered">
                <option value="">All Types</option>
                <option value="Recipe">Recipe</option>
                <option value="HowTo">How-To Guide</option>
                <option value="FAQ">FAQ</option>
                <option value="ItemList">Item List</option>
              </select>
            </div>

            <!-- Status Filter -->
            <div class="form-control">
              <select v-model="selectedStatus" class="select select-bordered">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <!-- Sort Options -->
            <div class="form-control">
              <select v-model="sortBy" class="select select-bordered">
                <option value="updated_at_desc">Recently Updated</option>
                <option value="created_at_desc">Recently Created</option>
                <option value="title_asc">Title A-Z</option>
                <option value="title_desc">Title Z-A</option>
              </select>
            </div>

            <!-- Clear Filters -->
            <button 
              v-if="hasActiveFilters"
              @click="clearFilters"
              class="btn btn-ghost btn-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-8">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="cards.length === 0" class="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-24 w-24 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h4 class="text-xl font-semibold mb-2">No cards yet</h4>
        <p class="text-base-content/70 mb-4">Create your first recipe card to get started</p>
        <button class="btn btn-primary" @click="createNewCard">Create First Card</button>
      </div>

      <div v-else-if="filteredCards.length === 0 && cards.length > 0" class="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h4 class="text-xl font-semibold mb-2">No cards match your filters</h4>
        <p class="text-base-content/70 mb-4">Try adjusting your search or filter criteria</p>
        <button class="btn btn-outline btn-sm" @click="clearFilters">Clear Filters</button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="card in filteredCards" :key="card.id" class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h4 class="card-title">{{ card.title }}</h4>
            <p class="text-sm text-base-content/70">{{ card.description }}</p>
            <div class="flex items-center gap-2 text-sm">
              <div class="badge" :class="{
                'badge-success': card.status === 'published',
                'badge-warning': card.status === 'draft',
                'badge-ghost': card.status === 'archived'
              }">
                {{ card.status }}
              </div>
              <span class="text-base-content/60">{{ card.type }}</span>
            </div>
            <div class="card-actions justify-end mt-4">
              <button class="btn btn-sm btn-ghost" @click="editCard(card.id)">Edit</button>
              <button class="btn btn-sm btn-primary" @click="viewCard(card.id)">View</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const { getCards } = useCards()

const cards = ref([])
const loading = ref(true)

// Filter and search state
const searchQuery = ref('')
const selectedType = ref('')
const selectedStatus = ref('')
const sortBy = ref('updated_at_desc')

const publishedCards = computed(() => cards.value.filter(card => card.status === 'published').length)
const draftCards = computed(() => cards.value.filter(card => card.status === 'draft').length)

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return searchQuery.value || selectedType.value || selectedStatus.value || sortBy.value !== 'updated_at_desc'
})

// Filtered and sorted cards
const filteredCards = computed(() => {
  let filtered = [...cards.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(card => 
      card.title.toLowerCase().includes(query) ||
      (card.description && card.description.toLowerCase().includes(query))
    )
  }

  // Apply type filter
  if (selectedType.value) {
    filtered = filtered.filter(card => card.type === selectedType.value)
  }

  // Apply status filter
  if (selectedStatus.value) {
    filtered = filtered.filter(card => card.status === selectedStatus.value)
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'updated_at_desc':
        return new Date(b.updated_at) - new Date(a.updated_at)
      case 'created_at_desc':
        return new Date(b.created_at) - new Date(a.created_at)
      case 'title_asc':
        return a.title.localeCompare(b.title)
      case 'title_desc':
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  return filtered
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  await router.push('/')
}

const createNewCard = () => {
  router.push('/cards/new')
}

const editCard = (id: string) => {
  router.push(`/cards/${id}/edit`)
}

const viewCard = (id: string) => {
  router.push(`/cards/${id}`)
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedType.value = ''
  selectedStatus.value = ''
  sortBy.value = 'updated_at_desc'
}

const fetchCards = async () => {
  loading.value = true
  try {
    const fetchedCards = await getCards()
    cards.value = fetchedCards || []
  } catch (error) {
    console.error('Error fetching cards:', error)
    cards.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCards()
})
</script>