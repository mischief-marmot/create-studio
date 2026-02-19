# Admin Components Documentation

This document provides usage examples for the reusable admin components in the Create Studio admin portal.

## Components

### AdminDataTable

A sortable, filterable table with pagination support.

**Props:**
- `columns: TableColumn[]` - Array of column definitions
- `data: Record<string, any>[]` - Array of data objects
- `loading?: boolean` - Loading state (default: false)
- `pageSize?: number` - Items per page (default: 10)

**Events:**
- `@sort` - Emitted when column is sorted: `(key: string, direction: 'asc' | 'desc')`

**Slots:**
- `cell-{columnKey}` - Custom cell rendering for specific columns

**Example:**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'created_at', label: 'Created', sortable: true },
]

const data = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', created_at: '2024-01-01' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'pending', created_at: '2024-01-02' },
])

const loading = ref(false)

const handleSort = (key: string, direction: 'asc' | 'desc') => {
  console.log(`Sorting by ${key} ${direction}`)
  // Implement sorting logic
}
</script>

<template>
  <AdminDataTable
    :columns="columns"
    :data="data"
    :loading="loading"
    :page-size="10"
    @sort="handleSort"
  >
    <!-- Custom status cell with badge -->
    <template #cell-status="{ value }">
      <AdminBadge :status="value" variant="status" />
    </template>
  </AdminDataTable>
</template>
```

---

### AdminStatCard

A metric display card with optional trend indicator.

**Props:**
- `title: string` - Card title
- `value: string | number` - The metric value
- `trend?: number` - Percentage trend (positive/negative)
- `trendLabel?: string` - Label for trend (default: "vs last period")
- `icon?: Component` - Optional icon component
- `formatValue?: (value: string | number) => string` - Custom value formatter

**Example:**

```vue
<script setup lang="ts">
import { UsersIcon } from '@heroicons/vue/24/outline'

const formatCurrency = (value: string | number) => {
  return `$${Number(value).toLocaleString()}`
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <AdminStatCard
      title="Total Users"
      :value="1234"
      :trend="12.5"
      trend-label="vs last month"
      :icon="UsersIcon"
    />

    <AdminStatCard
      title="Revenue"
      :value="45678"
      :trend="-5.2"
      :format-value="formatCurrency"
    />

    <AdminStatCard
      title="Active Sites"
      :value="89"
      :trend="0"
    />
  </div>
</template>
```

---

### AdminModal

A flexible modal for confirmations and forms.

**Props:**
- `open: boolean` - Controls modal visibility
- `title: string` - Modal title
- `description?: string` - Optional description text
- `variant?: 'confirm' | 'form' | 'info' | 'warning' | 'danger'` - Visual variant (default: 'form')
- `size?: 'sm' | 'md' | 'lg'` - Modal size (default: 'md')
- `icon?: Component` - Optional header icon
- `confirmText?: string` - Confirm button text (default: 'Confirm')
- `cancelText?: string` - Cancel button text (default: 'Cancel')
- `loadingText?: string` - Loading state text (default: 'Processing...')
- `loading?: boolean` - Loading state (default: false)
- `disabled?: boolean` - Disable confirm button (default: false)
- `showConfirm?: boolean` - Show confirm button (default: true)
- `showCancel?: boolean` - Show cancel button (default: true)

**Events:**
- `@confirm` - Emitted when confirm button clicked
- `@cancel` - Emitted when cancel button clicked
- `@close` - Emitted when modal is closed

**Example:**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'

const isDeleteModalOpen = ref(false)
const isLoading = ref(false)

const handleDelete = async () => {
  isLoading.value = true
  try {
    // Perform delete operation
    await deleteItem()
    isDeleteModalOpen.value = false
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button @click="isDeleteModalOpen = true" class="btn btn-error">
    Delete Item
  </button>

  <AdminModal
    :open="isDeleteModalOpen"
    title="Delete Item"
    description="Are you sure you want to delete this item? This action cannot be undone."
    variant="danger"
    :icon="TrashIcon"
    confirm-text="Delete"
    cancel-text="Cancel"
    :loading="isLoading"
    @confirm="handleDelete"
    @cancel="isDeleteModalOpen = false"
  />
</template>
```

---

### AdminSearchInput

A debounced search input field with clear functionality.

**Props:**
- `modelValue: string` - v-model binding
- `placeholder?: string` - Placeholder text (default: 'Search...')
- `debounce?: number` - Debounce delay in ms (default: 300)
- `ariaLabel?: string` - Accessibility label

**Events:**
- `@update:modelValue` - Emitted on input (immediate)
- `@search` - Emitted after debounce delay
- `@clear` - Emitted when clear button clicked

**Exposed Methods:**
- `focus()` - Focus the input
- `blur()` - Blur the input

**Example:**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')

const handleSearch = (value: string) => {
  console.log('Searching for:', value)
  // Perform search operation
}
</script>

<template>
  <AdminSearchInput
    v-model="searchQuery"
    placeholder="Search users..."
    :debounce="300"
    @search="handleSearch"
  />
</template>
```

---

### AdminFilterDropdown

A dropdown filter selector with visual feedback.

**Props:**
- `options: FilterOption[]` - Array of filter options
- `modelValue: string | number | null` - Selected value
- `label: string` - Filter label
- `showClearOption?: boolean` - Show "All" option (default: true)

**FilterOption Interface:**
```typescript
interface FilterOption {
  value: string | number
  label: string
}
```

**Events:**
- `@update:modelValue` - Emitted when selection changes
- `@change` - Emitted when selection changes

**Exposed Methods:**
- `open()` - Open dropdown
- `close()` - Close dropdown
- `toggle()` - Toggle dropdown

**Example:**

```vue
<script setup lang="ts">
import { ref } from 'vue'

const statusFilter = ref<string | null>(null)

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
]

const handleFilterChange = (value: string | number | null) => {
  console.log('Filter changed to:', value)
  // Perform filtering
}
</script>

<template>
  <AdminFilterDropdown
    v-model="statusFilter"
    :options="statusOptions"
    label="Status"
    @change="handleFilterChange"
  />
</template>
```

---

### AdminBadge

A status badge component with multiple variants.

**Props:**
- `status: string` - Status value (determines styling)
- `variant?: 'tier' | 'status' | 'role'` - Badge variant (default: 'status')
- `showDot?: boolean` - Show status dot indicator (default: true)
- `customText?: string` - Override display text
- `role?: string` - ARIA role (default: 'status')
- `ariaLabel?: string` - ARIA label

**Supported Status Values:**

**Tier Variant:**
- `free`, `basic`, `professional`, `enterprise`

**Status Variant:**
- `active`, `verified`, `success` - Green
- `pending`, `warning` - Yellow/Orange
- `suspended`, `error` - Red
- `inactive`, `neutral`, `info` - Gray/Blue

**Role Variant:**
- `admin`, `moderator`, `user`, `guest`

**Example:**

```vue
<template>
  <!-- Status badges -->
  <AdminBadge status="active" variant="status" />
  <AdminBadge status="pending" variant="status" />
  <AdminBadge status="suspended" variant="status" />

  <!-- Tier badges -->
  <AdminBadge status="free" variant="tier" />
  <AdminBadge status="professional" variant="tier" />
  <AdminBadge status="enterprise" variant="tier" />

  <!-- Role badges -->
  <AdminBadge status="admin" variant="role" />
  <AdminBadge status="moderator" variant="role" />

  <!-- Custom text -->
  <AdminBadge status="success" custom-text="Verified Site" />
</template>
```

---

## Complete Example: User Management Page

Here's a complete example showing all components working together:

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { UsersIcon, TrashIcon } from '@heroicons/vue/24/outline'

// Data
const users = ref([
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active', tier: 'enterprise' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'active', tier: 'professional' },
  { id: 3, name: 'Bob Wilson', email: 'bob@example.com', role: 'user', status: 'pending', tier: 'basic' },
])

// State
const searchQuery = ref('')
const statusFilter = ref<string | null>(null)
const loading = ref(false)
const deleteModalOpen = ref(false)
const selectedUser = ref<any>(null)

// Filters
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'suspended', label: 'Suspended' },
]

// Table columns
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: false },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'tier', label: 'Tier', sortable: false },
  { key: 'actions', label: 'Actions', sortable: false },
]

// Computed
const filteredUsers = computed(() => {
  let result = users.value

  if (searchQuery.value) {
    result = result.filter(user =>
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (statusFilter.value) {
    result = result.filter(user => user.status === statusFilter.value)
  }

  return result
})

const totalUsers = computed(() => users.value.length)
const activeUsers = computed(() => users.value.filter(u => u.status === 'active').length)

// Methods
const handleSearch = (value: string) => {
  // Search is reactive through v-model
  console.log('Search:', value)
}

const handleSort = (key: string, direction: 'asc' | 'desc') => {
  console.log('Sort:', key, direction)
  // Implement sorting logic
}

const openDeleteModal = (user: any) => {
  selectedUser.value = user
  deleteModalOpen.value = true
}

const handleDelete = async () => {
  loading.value = true
  try {
    // Delete user
    await new Promise(resolve => setTimeout(resolve, 1000))
    users.value = users.value.filter(u => u.id !== selectedUser.value.id)
    deleteModalOpen.value = false
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="admin-page-header">
      <h1 class="admin-page-title">Users</h1>
      <p class="admin-page-subtitle">Manage user accounts and permissions</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AdminStatCard
        title="Total Users"
        :value="totalUsers"
        :trend="12.5"
        :icon="UsersIcon"
      />
      <AdminStatCard
        title="Active Users"
        :value="activeUsers"
        :trend="8.3"
      />
      <AdminStatCard
        title="Pending"
        :value="totalUsers - activeUsers"
        :trend="-15.2"
      />
    </div>

    <!-- Filters -->
    <div class="flex gap-3">
      <div class="flex-1">
        <AdminSearchInput
          v-model="searchQuery"
          placeholder="Search users..."
          @search="handleSearch"
        />
      </div>
      <AdminFilterDropdown
        v-model="statusFilter"
        :options="statusOptions"
        label="Status"
      />
    </div>

    <!-- Table -->
    <AdminDataTable
      :columns="columns"
      :data="filteredUsers"
      :loading="loading"
      @sort="handleSort"
    >
      <template #cell-role="{ value }">
        <AdminBadge :status="value" variant="role" />
      </template>

      <template #cell-status="{ value }">
        <AdminBadge :status="value" variant="status" />
      </template>

      <template #cell-tier="{ value }">
        <AdminBadge :status="value" variant="tier" />
      </template>

      <template #cell-actions="{ row }">
        <button
          @click="openDeleteModal(row)"
          class="btn btn-sm btn-ghost btn-error"
        >
          Delete
        </button>
      </template>
    </AdminDataTable>

    <!-- Delete Modal -->
    <AdminModal
      :open="deleteModalOpen"
      title="Delete User"
      :description="`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`"
      variant="danger"
      :icon="TrashIcon"
      confirm-text="Delete User"
      :loading="loading"
      @confirm="handleDelete"
      @cancel="deleteModalOpen = false"
    />
  </div>
</template>
```

---

## Accessibility Features

All components follow accessibility best practices:

- **Keyboard Navigation**: Full keyboard support with proper tab order
- **ARIA Labels**: Appropriate ARIA attributes for screen readers
- **Focus Management**: Clear focus indicators and logical focus flow
- **Role Attributes**: Semantic HTML and ARIA roles
- **Color Contrast**: DaisyUI themes ensure sufficient contrast
- **Loading States**: Announced to screen readers

## Styling

Components use a combination of:
- **DaisyUI classes** for base styling
- **Custom CSS classes** from `/packages/admin/app/assets/main.css`
- **Tailwind utilities** for layout and spacing

The components automatically adapt to light/dark themes through DaisyUI's theme system.
