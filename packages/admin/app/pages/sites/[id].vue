<template>
  <div class="min-h-screen">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm text-base-content/50 font-light tracking-wide">Loading site details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[60vh]">
      <div class="max-w-md text-center space-y-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20">
          <svg class="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="space-y-2">
          <h3 class="text-xl text-base-content" style="font-family: 'Instrument Serif', serif;">Unable to Load Site</h3>
          <p class="text-sm text-base-content/60 leading-relaxed">{{ error }}</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="fetchSiteDetails">
          Try Again
        </button>
      </div>
    </div>

    <!-- Site Details -->
    <div v-else-if="site" class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Header with Back Navigation -->
      <div class="mb-12">
        <button
          class="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content transition-colors mb-6 font-medium tracking-wide group"
          @click="navigateBack"
          aria-label="Back to sites"
        >
          <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Sites</span>
        </button>

        <div class="space-y-2">
          <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
            <span class="text-base-content/50">Site Details</span>
            <span class="text-base-content/30">·</span>
            <span class="text-base-content/40">ID {{ site.id }}</span>
          </div>
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            {{ site.name || site.url }}
          </h1>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        <!-- Left Column: Site Profile Card -->
        <div class="space-y-6">
          <!-- Site Profile Card -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-8 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <!-- Site Icon Section -->
            <div class="flex justify-center mb-6">
              <div class="relative">
                <div class="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  <GlobeAltIcon class="w-12 h-12" />
                </div>
              </div>
            </div>

            <!-- Site Name Section -->
            <div class="space-y-4 text-center">
              <h2 class="text-2xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                {{ site.name || 'Unnamed Site' }}
              </h2>

              <!-- URL -->
              <a
                :href="site.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline group"
              >
                <span>{{ site.url }}</span>
                <svg class="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              <!-- Owner Link -->
              <div class="flex flex-col items-center gap-1">
                <span class="text-xs text-base-content/50 font-medium uppercase tracking-wider">Owner</span>
                <NuxtLink
                  :to="`/users/${site.owner.id}`"
                  class="text-sm text-base-content hover:text-primary transition-colors font-medium"
                >
                  {{ formatOwnerName(site.owner) }}
                  <span class="text-base-content/40 font-normal">#{{ site.owner.id }}</span>
                </NuxtLink>
              </div>
            </div>

            <!-- Divider -->
            <div class="my-6 h-px bg-gradient-to-r from-transparent via-base-300 to-transparent"></div>

            <!-- Site Attributes -->
            <div class="space-y-4">
              <!-- Canonical Site -->
              <div v-if="site.canonical_site" class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">Canonical Site</span>
                <NuxtLink
                  :to="`/sites/${site.canonical_site.id}`"
                  class="text-sm text-primary hover:underline"
                >
                  {{ site.canonical_site.name || truncateUrl(site.canonical_site.url) }}
                </NuxtLink>
              </div>

              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">Member Since</span>
                <span class="text-sm text-base-content font-medium">{{ formatDate(site.createdAt) }}</span>
              </div>

              <div class="flex items-center justify-between py-3">
                <span class="text-sm text-base-content/60 font-medium">Last Updated</span>
                <span class="text-sm text-base-content font-medium">{{ formatDate(site.updatedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- Version Information Card -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
              Version Information
            </h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">WordPress</span>
                <span class="text-sm text-base-content font-mono">{{ site.versions.wordpress || 'Unknown' }}</span>
              </div>

              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">PHP</span>
                <span class="text-sm text-base-content font-mono">{{ site.versions.php || 'Unknown' }}</span>
              </div>

              <div class="flex items-center justify-between py-3">
                <span class="text-sm text-base-content/60 font-medium">Create Plugin</span>
                <span class="text-sm text-base-content font-mono">{{ site.versions.create || 'Unknown' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Content -->
        <div class="space-y-6">
          <!-- Associated Users Section -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Associated Users
              </h3>
              <div class="flex items-center gap-3">
                <div class="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  {{ site.associated_users.length }}
                </div>
                <button
                  class="btn btn-sm btn-primary"
                  @click="openAddUserModal"
                  :disabled="actionLoading"
                >
                  <UserPlusIcon class="size-4 mr-1" />
                  Add User
                </button>
              </div>
            </div>

            <!-- No Users -->
            <div v-if="site.associated_users.length === 0" class="py-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p class="text-sm text-base-content/50">No associated users</p>
            </div>

            <!-- Users Table -->
            <div v-else class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-base-300/50">
                    <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">User</th>
                    <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Role</th>
                    <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                    <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Joined</th>
                    <th class="text-right py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="user in site.associated_users"
                    :key="user.id"
                    class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors"
                  >
                    <td
                      class="py-4 px-4 cursor-pointer"
                      @click="navigateToUser(user.id)"
                    >
                      <div class="font-medium text-sm text-base-content hover:text-primary transition-colors">{{ formatUserName(user) }}</div>
                      <div class="text-xs text-base-content/50">{{ user.email }}</div>
                    </td>
                    <td class="py-4 px-4">
                      <span class="text-sm font-medium text-base-content capitalize">{{ user.role }}</span>
                    </td>
                    <td class="py-4 px-4">
                      <span v-if="user.verified" class="inline-flex items-center gap-1.5 text-sm text-base-content">
                        <CheckIcon class="w-4 h-4 text-success" />
                        Verified
                      </span>
                      <span v-else class="text-sm text-base-content/50">Pending</span>
                    </td>
                    <td class="py-4 px-4">
                      <span class="text-sm text-base-content/70">{{ formatDate(user.joined_at) }}</span>
                    </td>
                    <td class="py-4 px-4">
                      <div class="flex items-center justify-end gap-1" @click.stop>
                        <!-- Change Role Dropdown -->
                        <div class="dropdown dropdown-end">
                          <label
                            tabindex="0"
                            class="btn btn-xs btn-ghost"
                            :class="{ 'btn-disabled': actionLoading }"
                          >
                            <PencilSquareIcon class="size-4" />
                          </label>
                          <ul
                            tabindex="0"
                            class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-32 z-10"
                          >
                            <li>
                              <a
                                :class="{ 'active': user.role === 'owner' }"
                                @click="openChangeRoleModal(user, 'owner')"
                              >Owner</a>
                            </li>
                            <li>
                              <a
                                :class="{ 'active': user.role === 'admin' }"
                                @click="openChangeRoleModal(user, 'admin')"
                              >Admin</a>
                            </li>
                            <li>
                              <a
                                :class="{ 'active': user.role === 'editor' }"
                                @click="openChangeRoleModal(user, 'editor')"
                              >Editor</a>
                            </li>
                          </ul>
                        </div>

                        <!-- Verify Button (only if not verified) -->
                        <button
                          v-if="!user.verified"
                          class="btn btn-xs btn-ghost text-success"
                          :disabled="actionLoading"
                          @click="handleVerifyUser(user)"
                          title="Verify user"
                        >
                          <CheckBadgeIcon class="size-4" />
                        </button>

                        <!-- Remove Button (disabled if site owner) -->
                        <button
                          class="btn btn-xs btn-ghost text-error"
                          :disabled="actionLoading || user.id === site.owner.id"
                          :title="user.id === site.owner.id ? 'Cannot remove site owner' : 'Remove user'"
                          @click="openRemoveUserModal(user)"
                        >
                          <TrashIcon class="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Subscription Details Section -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Subscription Details
              </h3>
            </div>

            <!-- No Subscription -->
            <div v-if="!site.subscription" class="py-12 text-center">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p class="text-sm text-base-content/50 mb-4">No active subscription</p>
              <button
                class="btn btn-sm btn-primary"
                @click="openCreateSubscriptionModal"
                :disabled="actionLoading"
              >
                <PlusIcon class="size-4 mr-1" />
                Create Subscription
              </button>
            </div>

            <!-- Subscription Info -->
            <div v-else>
              <div class="space-y-4 mb-6">
                <!-- Tier -->
                <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                  <span class="text-sm text-base-content/60 font-medium">Plan</span>
                  <span class="text-sm text-base-content font-semibold">{{ formatTier(site.subscription.tier) }}</span>
                </div>

                <!-- Status -->
                <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                  <span class="text-sm text-base-content/60 font-medium">Status</span>
                  <span
                    class="text-sm font-medium"
                    :class="getStatusClass(site.subscription.status)"
                  >
                    {{ formatStatus(site.subscription.status) }}
                  </span>
                </div>

                <!-- Period Start -->
                <div v-if="site.subscription.current_period_start" class="flex items-center justify-between py-3 border-b border-base-300/30">
                  <span class="text-sm text-base-content/60 font-medium">Period Start</span>
                  <span class="text-sm text-base-content font-medium">{{ formatDate(site.subscription.current_period_start) }}</span>
                </div>

                <!-- Period End / Renews -->
                <div v-if="site.subscription.current_period_end" class="flex items-center justify-between py-3 border-b border-base-300/30">
                  <span class="text-sm text-base-content/60 font-medium">{{ site.subscription.cancel_at_period_end ? 'Ends' : 'Renews' }}</span>
                  <span class="text-sm text-base-content font-medium">{{ formatDate(site.subscription.current_period_end) }}</span>
                </div>

                <!-- Auto-Renew -->
                <div v-if="site.subscription.cancel_at_period_end" class="flex items-center justify-between py-3">
                  <span class="text-sm text-base-content/60 font-medium">Auto-Renew</span>
                  <span class="text-sm text-base-content/50">Disabled</span>
                </div>
              </div>

              <!-- Link to Subscription Detail -->
              <NuxtLink
                :to="`/subscriptions/${site.subscription.id}`"
                class="flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-base-300 text-sm font-medium text-base-content hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
              >
                <span>View Subscription Details</span>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </NuxtLink>
            </div>
          </div>

          <!-- Site Settings Section -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.01em;">
                Site Settings
              </h3>
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60 font-medium">Interactive Mode</span>
                <span
                  class="text-sm font-medium"
                  :class="site.settings.interactive_mode_enabled ? 'text-base-content' : 'text-base-content/50'"
                >
                  {{ site.settings.interactive_mode_enabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>

              <div v-if="site.settings.interactive_mode_button_text" class="flex items-center justify-between py-3">
                <span class="text-sm text-base-content/60 font-medium">Button Text</span>
                <span class="text-sm text-base-content font-medium">{{ site.settings.interactive_mode_button_text }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add User Modal -->
      <AdminModal
        :open="showAddUserModal"
        title="Add User to Site"
        description="Search for a user by email and assign them a role"
        variant="form"
        confirm-text="Add User"
        :loading="actionLoading"
        :disabled="!selectedSearchUser"
        size="md"
        @confirm="handleAddUser"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="space-y-4">
          <!-- Search Input with Mode Toggle -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Search by</span>
            </label>
            <div class="flex items-center input input-bordered w-full pr-1">
              <input
                v-model="userSearchQuery"
                :type="searchMode === 'id' ? 'number' : 'text'"
                :placeholder="searchMode === 'id' ? 'Enter user ID...' : 'Type at least 2 characters...'"
                class="grow bg-transparent outline-none text-sm"
                @input="debouncedSearchUsers"
              />
              <div class="flex items-center gap-0.5 bg-base-200 rounded-md p-0.5 shrink-0">
                <button
                  type="button"
                  class="px-2.5 py-1 text-xs font-medium rounded transition-all"
                  :class="searchMode === 'email' ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/40 hover:text-base-content'"
                  @click="switchSearchMode('email')"
                >Email</button>
                <button
                  type="button"
                  class="px-2.5 py-1 text-xs font-medium rounded transition-all"
                  :class="searchMode === 'id' ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/40 hover:text-base-content'"
                  @click="switchSearchMode('id')"
                >ID</button>
              </div>
            </div>
          </div>

          <!-- Search Results -->
          <div v-if="userSearchLoading" class="flex justify-center py-4">
            <span class="loading loading-spinner loading-sm"></span>
          </div>
          <div v-else-if="userSearchResults.length > 0" class="border border-base-300 rounded-lg max-h-48 overflow-y-auto">
            <div
              v-for="searchUser in userSearchResults"
              :key="searchUser.id"
              class="p-3 border-b border-base-300 last:border-b-0"
              :class="[
                isUserAlreadyAssociated(searchUser.id)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-base-200 cursor-pointer',
                { 'bg-primary/10': selectedSearchUser?.id === searchUser.id }
              ]"
              @click="selectSearchUser(searchUser)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-sm">{{ formatSearchUserName(searchUser) }} <span class="text-base-content/40 font-normal">#{{ searchUser.id }}</span></div>
                  <div class="text-base-content/60 text-xs">{{ searchUser.email }}</div>
                </div>
                <span v-if="isUserAlreadyAssociated(searchUser.id)" class="text-xs text-base-content/40 italic">Already added</span>
              </div>
            </div>
          </div>
          <div v-else-if="userSearchQuery.trim().length >= (searchMode === 'id' ? 1 : 2) && !userSearchLoading" class="text-center py-4 text-base-content/60 text-sm">
            No users found
          </div>

          <!-- Selected User Display -->
          <div v-if="selectedSearchUser" class="bg-base-200 rounded-lg p-3">
            <div class="text-xs text-base-content/60 mb-1">Selected User</div>
            <div class="font-medium">{{ formatSearchUserName(selectedSearchUser) }}</div>
            <div class="text-sm text-base-content/60">{{ selectedSearchUser.email }}</div>
          </div>

          <!-- Role Selection -->
          <div class="form-control">
            <label class="label">
              <span class="label-text">Role</span>
            </label>
            <select v-model="addUserRole" class="select select-bordered w-full">
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        </div>
      </AdminModal>

      <!-- Change Role Modal -->
      <AdminModal
        :open="showChangeRoleModal"
        title="Change User Role"
        :description="`Update role for ${selectedUser ? formatUserName(selectedUser) : 'user'}`"
        variant="confirm"
        confirm-text="Change Role"
        :loading="actionLoading"
        @confirm="handleChangeRole"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="space-y-4">
          <p class="text-sm text-base-content/70">
            Change <strong>{{ selectedUser?.email }}</strong> from
            <span class="font-medium">{{ selectedUser?.role }}</span> to
            <span class="font-medium">{{ newRole }}</span>?
          </p>
        </div>
      </AdminModal>

      <!-- Remove User Modal -->
      <AdminModal
        :open="showRemoveUserModal"
        title="Remove User from Site"
        description="This action cannot be undone"
        variant="danger"
        confirm-text="Remove User"
        :loading="actionLoading"
        @confirm="handleRemoveUser"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
          <p class="text-sm font-medium text-error mb-2">Warning: This will:</p>
          <ul class="text-sm text-base-content/70 space-y-1 list-disc list-inside">
            <li>Remove the user's access to this site</li>
            <li>Revoke all permissions for this user on this site</li>
          </ul>
        </div>
        <p class="text-sm text-base-content/70">
          User: <strong>{{ selectedUser?.email }}</strong>
        </p>
      </AdminModal>

      <!-- Create Subscription Modal -->
      <AdminModal
        :open="showCreateSubscriptionModal"
        title="Create Subscription"
        description="Create a new subscription for this site"
        variant="form"
        confirm-text="Create Subscription"
        :loading="actionLoading"
        @confirm="handleCreateSubscription"
        @cancel="closeModals"
        @close="closeModals"
      >
        <div class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Tier</span>
            </label>
            <select v-model="newSubscriptionTier" class="select select-bordered w-full">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Status</span>
            </label>
            <select v-model="newSubscriptionStatus" class="select select-bordered w-full">
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
              <option value="incomplete">Incomplete</option>
            </select>
          </div>
        </div>
      </AdminModal>

      <!-- Toast Alert -->
      <div v-if="alertMessage" class="toast toast-top toast-end">
        <div
          class="alert shadow-lg"
          :class="alertType === 'success' ? 'alert-success' : 'alert-error'"
        >
          <span>{{ alertMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  UserPlusIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  TrashIcon,
  PlusIcon,
  GlobeAltIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'admin'
})

interface Owner {
  id: number
  email: string
  firstname: string | null
  lastname: string | null
}

interface CanonicalSite {
  id: number
  name: string | null
  url: string
}

interface AssociatedUser {
  id: number
  email: string
  firstname: string | null
  lastname: string | null
  role: string
  verified: boolean
  verified_at: string | null
  joined_at: string
}

interface Subscription {
  id: number
  status: string
  tier: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

interface Site {
  id: number
  name: string | null
  url: string
  owner: Owner
  versions: {
    create: string | null
    wordpress: string | null
    php: string | null
  }
  settings: {
    interactive_mode_enabled: boolean
    interactive_mode_button_text: string | null
  }
  canonical_site: CanonicalSite | null
  associated_users: AssociatedUser[]
  subscription: Subscription | null
  createdAt: string
  updatedAt: string
}

const router = useRouter()
const route = useRoute()

// Search user interface for add user modal
interface SearchUser {
  id: number
  email: string
  firstname: string | null
  lastname: string | null
}

// State
const site = ref<Site | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const actionLoading = ref(false)

// Modal state
const showAddUserModal = ref(false)
const showChangeRoleModal = ref(false)
const showRemoveUserModal = ref(false)
const showCreateSubscriptionModal = ref(false)

// Selected user for actions
const selectedUser = ref<AssociatedUser | null>(null)
const newRole = ref<string>('editor')

// Add user modal state
const searchMode = ref<'email' | 'id'>('email')
const userSearchQuery = ref('')
const userSearchResults = ref<SearchUser[]>([])
const userSearchLoading = ref(false)
const selectedSearchUser = ref<SearchUser | null>(null)
const addUserRole = ref<string>('editor')

// Create subscription modal state
const newSubscriptionTier = ref<string>('free')
const newSubscriptionStatus = ref<string>('active')

// Alert state
const alertMessage = ref<string | null>(null)
const alertType = ref<'success' | 'error'>('success')

// Debounce timer for user search
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Fetch site details
const fetchSiteDetails = async () => {
  loading.value = true
  error.value = null

  try {
    const siteId = route.params.id
    const response = await $fetch<Site>(`/api/admin/sites/${siteId}`)
    site.value = response
  } catch (err: any) {
    console.error('Failed to fetch site details:', err)
    if (err?.statusCode === 404) {
      error.value = 'Site not found'
    } else {
      error.value = err?.data?.message || 'Failed to load site details. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// Navigation
const navigateBack = () => {
  router.push('/sites')
}

const navigateToUser = (userId: number) => {
  router.push(`/users/${userId}`)
}

// Alert helper
const showAlert = (message: string, type: 'success' | 'error') => {
  alertMessage.value = message
  alertType.value = type
  setTimeout(() => {
    alertMessage.value = null
  }, 5000)
}

// Modal handlers
const closeModals = () => {
  showAddUserModal.value = false
  showChangeRoleModal.value = false
  showRemoveUserModal.value = false
  showCreateSubscriptionModal.value = false
  selectedUser.value = null
  selectedSearchUser.value = null
  searchMode.value = 'email'
  userSearchQuery.value = ''
  userSearchResults.value = []
  newRole.value = 'editor'
  addUserRole.value = 'editor'
  newSubscriptionTier.value = 'free'
  newSubscriptionStatus.value = 'active'
}

const openAddUserModal = () => {
  showAddUserModal.value = true
}

const openChangeRoleModal = (user: AssociatedUser, role: string) => {
  if (user.role === role) return // Don't open if same role
  selectedUser.value = user
  newRole.value = role
  showChangeRoleModal.value = true
}

const openRemoveUserModal = (user: AssociatedUser) => {
  if (user.id === site.value?.owner.id) return // Don't allow removing site owner
  selectedUser.value = user
  showRemoveUserModal.value = true
}

const openCreateSubscriptionModal = () => {
  showCreateSubscriptionModal.value = true
}

// User search
const switchSearchMode = (mode: 'email' | 'id') => {
  searchMode.value = mode
  userSearchQuery.value = ''
  userSearchResults.value = []
  selectedSearchUser.value = null
}

const searchUsers = async () => {
  const q = userSearchQuery.value.trim()
  const minLength = searchMode.value === 'id' ? 1 : 2
  if (q.length < minLength) {
    userSearchResults.value = []
    return
  }

  userSearchLoading.value = true
  try {
    const results = await $fetch<SearchUser[]>(`/api/admin/users/search?q=${encodeURIComponent(q)}&mode=${searchMode.value}`)
    userSearchResults.value = results
  } catch (err: any) {
    console.error('Failed to search users:', err)
    userSearchResults.value = []
  } finally {
    userSearchLoading.value = false
  }
}

const debouncedSearchUsers = () => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    searchUsers()
  }, 300)
}

const isUserAlreadyAssociated = (userId: number): boolean => {
  return site.value?.associated_users.some(u => u.id === userId) || false
}

const selectSearchUser = (user: SearchUser) => {
  if (isUserAlreadyAssociated(user.id)) return
  selectedSearchUser.value = user
}

const formatSearchUserName = (user: SearchUser): string => {
  if (user.firstname && user.lastname) {
    return `${user.firstname} ${user.lastname}`
  }
  if (user.firstname) return user.firstname
  if (user.lastname) return user.lastname
  return user.email
}

// Action handlers
const handleAddUser = async () => {
  if (!site.value || !selectedSearchUser.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/sites/${site.value.id}/users`, {
      method: 'POST',
      body: {
        userId: selectedSearchUser.value.id,
        role: addUserRole.value,
      },
    })
    showAlert('User added successfully', 'success')
    closeModals()
    await fetchSiteDetails()
  } catch (err: any) {
    console.error('Failed to add user:', err)
    showAlert(err?.data?.message || 'Failed to add user', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleChangeRole = async () => {
  if (!site.value || !selectedUser.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/site-users/${site.value.id}/${selectedUser.value.id}`, {
      method: 'PATCH',
      body: {
        role: newRole.value,
      },
    })
    showAlert(`Role changed to ${newRole.value} successfully`, 'success')
    closeModals()
    await fetchSiteDetails()
  } catch (err: any) {
    console.error('Failed to change role:', err)
    showAlert(err?.data?.message || 'Failed to change role', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleVerifyUser = async (user: AssociatedUser) => {
  if (!site.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/site-users/${site.value.id}/${user.id}/verify`, {
      method: 'POST',
    })
    showAlert('User verified successfully', 'success')
    await fetchSiteDetails()
  } catch (err: any) {
    console.error('Failed to verify user:', err)
    showAlert(err?.data?.message || 'Failed to verify user', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleRemoveUser = async () => {
  if (!site.value || !selectedUser.value) return

  actionLoading.value = true
  try {
    await $fetch(`/api/admin/site-users/${site.value.id}/${selectedUser.value.id}`, {
      method: 'DELETE',
    })
    showAlert('User removed successfully', 'success')
    closeModals()
    await fetchSiteDetails()
  } catch (err: any) {
    console.error('Failed to remove user:', err)
    showAlert(err?.data?.message || 'Failed to remove user', 'error')
  } finally {
    actionLoading.value = false
  }
}

const handleCreateSubscription = async () => {
  if (!site.value) return

  actionLoading.value = true
  try {
    await $fetch('/api/admin/subscriptions/create', {
      method: 'POST',
      body: {
        siteId: site.value.id,
        tier: newSubscriptionTier.value,
        status: newSubscriptionStatus.value,
      },
    })
    showAlert('Subscription created successfully', 'success')
    closeModals()
    await fetchSiteDetails()
  } catch (err: any) {
    console.error('Failed to create subscription:', err)
    showAlert(err?.data?.message || 'Failed to create subscription', 'error')
  } finally {
    actionLoading.value = false
  }
}

// Format helpers
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatOwnerName = (owner: Owner): string => {
  if (owner.firstname && owner.lastname) {
    return `${owner.firstname} ${owner.lastname}`
  }
  if (owner.firstname) return owner.firstname
  if (owner.lastname) return owner.lastname
  return owner.email
}

const formatUserName = (user: AssociatedUser): string => {
  if (user.firstname && user.lastname) {
    return `${user.firstname} ${user.lastname}`
  }
  if (user.firstname) return user.firstname
  if (user.lastname) return user.lastname
  return user.email
}

const truncateUrl = (url: string): string => {
  if (url.length > 40) {
    return url.substring(0, 37) + '...'
  }
  return url
}

const formatTier = (tier: string): string => {
  const tierMap: Record<string, string> = {
    'free': 'Free Plan',
    'pro': 'Pro Plan',
    'enterprise': 'Enterprise Plan'
  }
  return tierMap[tier] || tier.charAt(0).toUpperCase() + tier.slice(1) + ' Plan'
}

const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'trialing': 'Trialing',
    'past_due': 'Past Due',
    'canceled': 'Canceled',
    'incomplete': 'Incomplete',
    'incomplete_expired': 'Expired',
    'unpaid': 'Unpaid',
    'paused': 'Paused'
  }
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1)
}

const getStatusClass = (status: string): string => {
  const positiveStatuses = ['active', 'trialing']
  const negativeStatuses = ['canceled', 'incomplete', 'incomplete_expired', 'unpaid']
  const warningStatuses = ['past_due', 'paused']

  if (positiveStatuses.includes(status)) {
    return 'text-success'
  } else if (negativeStatuses.includes(status)) {
    return 'text-error'
  } else if (warningStatuses.includes(status)) {
    return 'text-warning'
  }
  return 'text-base-content'
}

// Initialize
onMounted(() => {
  fetchSiteDetails()
})
</script>
