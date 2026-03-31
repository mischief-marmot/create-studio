<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">CRM</span>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Publisher Intelligence</span>
        </div>
        <div class="flex items-center justify-between">
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            Leads
          </h1>
          <div class="flex items-center gap-2">
            <button
              class="btn btn-primary btn-sm"
              :disabled="scraping"
              @click="runScrape"
            >
              <span v-if="scraping" class="loading loading-spinner loading-xs"></span>
              <ArrowPathIcon v-else class="w-4 h-4" />
              {{ scraping ? 'Scraping...' : 'Scrape sellers.json' }}
            </button>
            <button
              class="btn btn-outline btn-sm"
              :disabled="pipelineRunning"
              @click="runPipeline"
            >
              <span v-if="pipelineRunning" class="loading loading-spinner loading-xs"></span>
              <SparklesIcon v-else class="w-4 h-4" />
              {{ pipelineRunning ? 'Running...' : 'Run Pipeline (50)' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Sub Navigation -->
      <div class="flex gap-1 mb-6">
        <NuxtLink to="/crm/leads" class="btn btn-sm" :class="'btn-primary'">Leads</NuxtLink>
        <NuxtLink to="/crm/outreach" class="btn btn-sm btn-ghost">Outreach</NuxtLink>
        <NuxtLink to="/crm/pipeline" class="btn btn-sm btn-ghost">Pipeline</NuxtLink>
      </div>

      <!-- Stats Cards -->
      <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ stats.publishers.total.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">Total Publishers</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ stats.publishers.wordpress.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">WordPress</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ stats.contacts.withEmail.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">With Email</div>
        </div>
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ stats.outreach.total.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">Outreach</div>
        </div>

        <!-- Pipeline Progress Card -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-4 shadow-sm">
          <div class="text-2xl font-bold text-base-content">{{ pipelineProcessed.toLocaleString() }}</div>
          <div class="text-xs text-base-content/50 uppercase tracking-wider mt-1">Processed</div>
          <div v-if="stats.publishers.byStatus" class="mt-2 flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-base-200">
            <div
              v-if="stats.publishers.byStatus.complete"
              class="bg-success h-full"
              :style="{ width: pipelineBarWidth('complete') }"
              :title="`Complete: ${stats.publishers.byStatus.complete}`"
            ></div>
            <div
              v-if="stats.publishers.byStatus.contacts_scraped"
              class="bg-accent h-full"
              :style="{ width: pipelineBarWidth('contacts_scraped') }"
              :title="`Contacts scraped: ${stats.publishers.byStatus.contacts_scraped}`"
            ></div>
            <div
              v-if="stats.publishers.byStatus.enriched"
              class="bg-warning h-full"
              :style="{ width: pipelineBarWidth('enriched') }"
              :title="`Enriched: ${stats.publishers.byStatus.enriched}`"
            ></div>
            <div
              v-if="stats.publishers.byStatus.plugins_scraped"
              class="bg-info h-full"
              :style="{ width: pipelineBarWidth('plugins_scraped') }"
              :title="`Plugins scraped: ${stats.publishers.byStatus.plugins_scraped}`"
            ></div>
          </div>
          <div v-if="stats.publishers.byStatus?.pending" class="text-[10px] text-base-content/40 mt-1">
            {{ stats.publishers.byStatus.pending.toLocaleString() }} pending
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <AdminSearchInput
              v-model="searchQuery"
              placeholder="Search by domain..."
              :debounce="300"
              @search="handleSearch"
            />
          </div>
          <div class="flex gap-2">
            <AdminFilterDropdown
              v-model="statusFilter"
              :options="statusOptions"
              label="Status"
              @change="handleFilterChange"
            />
            <AdminFilterDropdown
              v-model="wordpressFilter"
              :options="wordpressOptions"
              label="WordPress"
              @change="handleFilterChange"
            />
            <AdminFilterDropdown
              v-model="networkFilter"
              :options="networkOptions"
              label="Ad Network"
              @change="handleFilterChange"
            />
            <AdminFilterDropdown
              v-model="hasEmailFilter"
              :options="hasEmailOptions"
              label="Email"
              @change="handleFilterChange"
            />
          </div>
        </div>
      </div>

      <!-- Publishers Table -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-16">
          <div class="flex flex-col items-center gap-4">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <p class="text-sm text-base-content/50 font-light tracking-wide">Loading leads...</p>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20 mb-4">
            <ExclamationCircleIcon class="w-8 h-8 text-error" />
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">Unable to Load Leads</h3>
          <p class="text-sm text-base-content/60 mb-4">{{ error }}</p>
          <button class="btn btn-outline btn-sm" @click="fetchPublishers">Try Again</button>
        </div>

        <!-- Table -->
        <div v-else-if="publishers.length > 0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Domain</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Ad Networks</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">WordPress</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Category</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Posts</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                  <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Scraped</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pub in publishers"
                  :key="pub.id"
                  class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors cursor-pointer"
                  @click="openDrawer(pub)"
                >
                  <td class="py-4 px-6">
                    <div class="font-medium text-base-content">{{ pub.domain }}</div>
                    <div v-if="pub.siteName" class="text-sm text-base-content/50 truncate max-w-[200px]">{{ pub.siteName }}</div>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex flex-wrap gap-1">
                      <span
                        v-for="network in (pub.adNetworks as string[] || [])"
                        :key="network"
                        class="badge badge-sm badge-outline"
                      >
                        {{ network }}
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-1.5">
                      <template v-if="pub.isWordpress">
                        <CheckCircleIcon class="w-4 h-4 text-success" />
                        <span class="text-sm text-base-content/70">Yes</span>
                      </template>
                      <template v-else-if="pub.scrapeStatus === 'pending'">
                        <span class="text-sm text-base-content/40">&mdash;</span>
                      </template>
                      <template v-else>
                        <span class="text-sm text-base-content/50">No</span>
                      </template>
                    </div>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="pub.siteCategory" class="badge badge-sm" :class="categoryBadgeClass(pub.siteCategory)">
                      {{ pub.siteCategory }}
                    </span>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="pub.postCount" class="text-sm font-medium text-base-content">{{ pub.postCount.toLocaleString() }}</span>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>
                  <td class="py-4 px-6">
                    <span class="badge badge-sm" :class="statusBadgeClass(pub.scrapeStatus)">
                      {{ pub.scrapeStatus }}
                    </span>
                  </td>
                  <td class="py-4 px-6">
                    <span v-if="pub.lastScrapedAt" class="text-sm text-base-content/70">{{ formatDate(pub.lastScrapedAt) }}</span>
                    <span v-else class="text-sm text-base-content/40">&mdash;</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div
            v-if="pagination.totalPages > 1"
            class="border-t border-base-300/50 px-6 py-4 flex items-center justify-between"
          >
            <div class="text-base-content/60 text-sm">
              Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total.toLocaleString() }} leads
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn btn-sm btn-ghost"
                :disabled="pagination.page === 1"
                @click="handlePageChange(pagination.page - 1)"
                aria-label="Previous page"
              >
                <ChevronLeftIcon class="size-4" />
              </button>
              <div class="flex items-center gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  class="btn btn-sm"
                  :class="page === pagination.page ? 'btn-primary' : 'btn-ghost'"
                  @click="handlePageChange(page)"
                >
                  {{ page }}
                </button>
              </div>
              <button
                class="btn btn-sm btn-ghost"
                :disabled="pagination.page === pagination.totalPages"
                @click="handlePageChange(pagination.page + 1)"
                aria-label="Next page"
              >
                <ChevronRightIcon class="size-4" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-base-200 text-base-content/30 mb-4">
            <GlobeAltIcon class="w-8 h-8" />
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">No Leads Yet</h3>
          <p class="text-sm text-base-content/50 mb-4">Run a sellers.json scrape to discover publishers</p>
          <button class="btn btn-primary btn-sm" :disabled="scraping" @click="runScrape">
            Scrape sellers.json
          </button>
        </div>
      </div>

      <!-- Scrape Result Toast -->
      <div v-if="scrapeResult" class="toast toast-end toast-bottom">
        <div class="alert" :class="scrapeResult.success ? 'alert-success' : 'alert-error'">
          <span>{{ scrapeResult.message }}</span>
          <button class="btn btn-ghost btn-xs" @click="scrapeResult = null">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <Transition name="fade">
      <div
        v-if="drawerOpen"
        class="fixed inset-0 bg-black/30 z-30"
        @click="closeDrawer"
      ></div>
    </Transition>

    <!-- Publisher Detail Drawer -->
    <div
      class="fixed top-0 right-0 w-[520px] max-w-full h-screen bg-base-100 border-l border-base-300 z-[31] flex flex-col transition-transform duration-250 ease-out overflow-y-auto"
      :class="drawerOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <template v-if="selectedPublisher">
        <!-- Drawer Header -->
        <div class="px-6 py-5 border-b border-base-300/50 flex items-center justify-between sticky top-0 bg-base-100 z-[1]">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold text-base-content truncate">{{ selectedPublisher.domain }}</h3>
              <span v-if="publisherDetail?.stats.isActive" class="badge badge-sm badge-success badge-outline">Active</span>
              <span v-else-if="publisherDetail && !publisherDetail.stats.isActive" class="badge badge-sm badge-ghost">Inactive</span>
            </div>
            <p v-if="selectedPublisher.siteName" class="text-sm text-base-content/50 truncate">{{ selectedPublisher.siteName }}</p>
          </div>
          <button class="btn btn-ghost btn-sm btn-square flex-shrink-0" @click="closeDrawer">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Drawer Body -->
        <div v-if="detailLoading" class="flex-1 flex items-center justify-center">
          <span class="loading loading-spinner loading-lg text-primary"></span>
        </div>
        <div v-else class="p-6 flex-1 space-y-6">
          <!-- Ad Networks -->
          <div>
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Ad Networks</div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="network in (selectedPublisher.adNetworks as string[] || [])"
                :key="network"
                class="badge badge-sm badge-outline"
              >
                {{ network }}
              </span>
              <span v-if="!selectedPublisher.adNetworks?.length" class="text-sm text-base-content/40">&mdash;</span>
            </div>
          </div>

          <!-- WordPress & REST API Status -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">WordPress</div>
              <div class="flex items-center gap-1.5">
                <template v-if="selectedPublisher.isWordpress">
                  <CheckCircleIcon class="w-4 h-4 text-success" />
                  <span class="text-sm text-base-content">Yes</span>
                </template>
                <template v-else-if="selectedPublisher.scrapeStatus === 'pending'">
                  <span class="text-sm text-base-content/40">Unknown</span>
                </template>
                <template v-else>
                  <XCircleIcon class="w-4 h-4 text-base-content/30" />
                  <span class="text-sm text-base-content/50">No</span>
                </template>
              </div>
            </div>
            <div>
              <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">REST API</div>
              <div class="flex items-center gap-1.5">
                <template v-if="selectedPublisher.restApiAvailable">
                  <CheckCircleIcon class="w-4 h-4 text-success" />
                  <span class="text-sm text-base-content">Available</span>
                </template>
                <template v-else>
                  <span class="text-sm text-base-content/40">&mdash;</span>
                </template>
              </div>
            </div>
          </div>

          <!-- Site Category -->
          <div>
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-1">Category</div>
            <span v-if="selectedPublisher.siteCategory" class="badge badge-sm" :class="categoryBadgeClass(selectedPublisher.siteCategory)">
              {{ selectedPublisher.siteCategory }}
            </span>
            <span v-else class="text-sm text-base-content/40">&mdash;</span>
          </div>

          <!-- Publishing Stats -->
          <div>
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Publishing Stats</div>
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-base-200/50 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-base-content">{{ selectedPublisher.postCount?.toLocaleString() || '&mdash;' }}</div>
                <div class="text-[10px] text-base-content/50 uppercase tracking-wider">Posts</div>
              </div>
              <div class="bg-base-200/50 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-base-content">{{ drawerYearsPublishing || '&mdash;' }}</div>
                <div class="text-[10px] text-base-content/50 uppercase tracking-wider">Years</div>
              </div>
              <div class="bg-base-200/50 rounded-lg p-3 text-center">
                <div class="text-lg font-bold text-base-content">{{ drawerPostsPerMonth || '&mdash;' }}</div>
                <div class="text-[10px] text-base-content/50 uppercase tracking-wider">Posts/Mo</div>
              </div>
            </div>
          </div>

          <!-- Plugin Stack -->
          <div v-if="publisherDetail?.plugins?.length">
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Plugin Stack</div>

            <!-- Summary badges -->
            <div class="flex flex-wrap gap-2 mb-3">
              <span v-if="publisherDetail.stats.paidPluginCount" class="badge badge-sm badge-primary badge-outline">
                {{ publisherDetail.stats.paidPluginCount }} paid
              </span>
              <span v-if="publisherDetail.stats.competitorPluginCount" class="badge badge-sm badge-error badge-outline">
                {{ publisherDetail.stats.competitorPluginCount }} competitor
              </span>
              <span v-if="publisherDetail.stats.replaceablePluginCount" class="badge badge-sm badge-warning badge-outline">
                {{ publisherDetail.stats.replaceablePluginCount }} replaceable
              </span>
            </div>

            <!-- Plugin list -->
            <div class="space-y-1">
              <div v-for="plugin in publisherDetail.plugins" :key="plugin.namespace"
                class="flex items-center justify-between py-1.5 px-2 rounded-md bg-base-200/30">
                <div class="min-w-0">
                  <span class="text-sm text-base-content">{{ plugin.name || plugin.namespace }}</span>
                  <span v-if="plugin.category" class="text-xs text-base-content/40 ml-1.5">{{ plugin.category }}</span>
                </div>
                <div class="flex gap-1 flex-shrink-0">
                  <span v-if="plugin.isCompetitor" class="badge badge-xs badge-error badge-outline">competitor</span>
                  <span v-if="plugin.isPaid" class="badge badge-xs badge-primary badge-outline">paid</span>
                  <span v-if="plugin.replaceableByCreate" class="badge badge-xs badge-warning badge-outline">replaceable</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Content -->
          <div v-if="selectedPublisher.topContent?.length">
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Top Content</div>
            <div class="space-y-1.5">
              <div
                v-for="(item, idx) in (selectedPublisher.topContent as TopContentEntry[])"
                :key="idx"
                class="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-base-200/50 transition-colors"
              >
                <span class="text-sm text-base-content truncate">{{ item.title }}</span>
                <span v-if="item.comments" class="text-xs text-base-content/40 flex-shrink-0">{{ item.comments }} comments</span>
              </div>
            </div>
          </div>

          <!-- Social Links -->
          <div v-if="hasSocialLinks">
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Social Links</div>
            <div class="flex flex-wrap gap-2">
              <a
                v-for="(url, platform) in (selectedPublisher.socialLinks as SocialLinks)"
                :key="platform"
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-ghost btn-sm gap-1.5 text-base-content/70 hover:text-primary"
                :title="String(platform)"
              >
                <LinkIcon class="w-3.5 h-3.5" />
                <span class="text-xs capitalize">{{ platform }}</span>
              </a>
            </div>
          </div>

          <!-- Contact Info -->
          <div v-if="selectedPublisher.contactEmail || selectedPublisher.contactId">
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Contact</div>
            <div class="bg-base-200/50 rounded-lg p-3 space-y-1">
              <div v-if="selectedPublisher.contactName" class="font-medium text-base-content text-sm">
                {{ selectedPublisher.contactName }}
              </div>
              <div v-if="selectedPublisher.contactEmail" class="flex items-center gap-2">
                <svg class="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <a :href="`mailto:${selectedPublisher.contactEmail}`" class="text-sm text-primary hover:underline">
                  {{ selectedPublisher.contactEmail }}
                </a>
              </div>
              <div v-if="selectedPublisher.contactSource" class="text-xs text-base-content/40">
                Found via {{ selectedPublisher.contactSource.replace(/_/g, ' ') }}
              </div>
            </div>
          </div>

          <!-- Scrape Status -->
          <div>
            <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Scrape Status</div>
            <div class="flex items-center gap-3">
              <span class="badge badge-sm" :class="statusBadgeClass(selectedPublisher.scrapeStatus)">
                {{ selectedPublisher.scrapeStatus }}
              </span>
              <span v-if="selectedPublisher.lastScrapedAt" class="text-xs text-base-content/50">
                {{ formatDate(selectedPublisher.lastScrapedAt) }}
              </span>
            </div>
            <p v-if="selectedPublisher.scrapeError" class="text-xs text-error/80 mt-1.5">
              {{ selectedPublisher.scrapeError }}
            </p>
          </div>
        </div> <!-- end v-else (drawer body content) -->
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  ArrowPathIcon,
  GlobeAltIcon,
  SparklesIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'admin'
})

interface TopContentEntry {
  title: string
  comments: number
}

interface SocialLinks {
  instagram?: string
  pinterest?: string
  youtube?: string
  facebook?: string
  twitter?: string
  tiktok?: string
}

interface Publisher {
  id: number
  domain: string
  siteName: string | null
  adNetworks: string[] | null
  isWordpress: boolean
  restApiAvailable: boolean
  siteCategory: string | null
  postCount: number | null
  oldestPostDate: string | null
  newestPostDate: string | null
  topContent: TopContentEntry[] | null
  socialLinks: SocialLinks | null
  scrapeStatus: string
  scrapeError: string | null
  lastScrapedAt: string | null
  contactId: number | null
  contactEmail: string | null
  contactName: string | null
  contactSource: string | null
  createStudioSiteId: number | null
  createdAt: string
}

interface PublisherDetail {
  publisher: Publisher & { contactEmail: string | null; contactName: string | null; contactSource: string | null }
  plugins: Array<{ namespace: string; name: string | null; category: string | null; isPaid: boolean; isCompetitor: boolean; replaceableByCreate: boolean }>
  stats: {
    isActive: boolean
    yearsPublishing: number | null
    postsPerMonth: number | null
    paidPluginCount: number
    competitorPluginCount: number
    replaceablePluginCount: number
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  publishers: { total: number; wordpress: number; byStatus: Record<string, number> }
  contacts: { total: number; withEmail: number }
  outreach: { total: number }
  networks: Array<{ slug: string; name: string; publisherCount: number; lastFetchedAt: string | null }>
}

// State
const publishers = ref<Publisher[]>([])
const pagination = ref<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
const loading = ref(false)
const error = ref<string | null>(null)
const stats = ref<Stats | null>(null)
const scraping = ref(false)
const pipelineRunning = ref(false)
const scrapeResult = ref<{ success: boolean; message: string } | null>(null)

// Drawer
const drawerOpen = ref(false)
const selectedPublisher = ref<Publisher | null>(null)
const publisherDetail = ref<PublisherDetail | null>(null)
const detailLoading = ref(false)

// Filters
const searchQuery = ref('')
const statusFilter = ref<string | number | null>(null)
const wordpressFilter = ref<string | number | null>(null)
const networkFilter = ref<string | number | null>(null)
const hasEmailFilter = ref<string | number | null>(null)

const hasEmailOptions = [
  { value: 'true', label: 'Has Email' },
]

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'plugins_scraped', label: 'Plugins Scraped' },
  { value: 'enriched', label: 'Enriched' },
  { value: 'contacts_scraped', label: 'Contacts Scraped' },
  { value: 'complete', label: 'Complete' },
  { value: 'failed', label: 'Failed' },
]

const wordpressOptions = [
  { value: 'true', label: 'WordPress' },
]

const networkOptions = [
  { value: 'raptive', label: 'Raptive' },
  { value: 'mediavine', label: 'Mediavine' },
  { value: 'shemedia', label: 'SHE Media' },
  { value: 'journey', label: 'Journey' },
  { value: 'pubnation', label: 'PubNation' },
  { value: 'monumetric', label: 'Monumetric' },
]

// Pagination helpers
const startIndex = computed(() => (pagination.value.page - 1) * pagination.value.limit)
const endIndex = computed(() => startIndex.value + pagination.value.limit)

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, pagination.value.page - Math.floor(maxVisible / 2))
  let end = Math.min(pagination.value.totalPages, start + maxVisible - 1)
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Pipeline stats helpers
const pipelineProcessed = computed(() => {
  if (!stats.value?.publishers.byStatus) return 0
  const byStatus = stats.value.publishers.byStatus
  return (byStatus.plugins_scraped || 0) + (byStatus.enriched || 0) + (byStatus.contacts_scraped || 0) + (byStatus.complete || 0)
})

const pipelineBarWidth = (status: string): string => {
  if (!stats.value?.publishers.total) return '0%'
  const count = stats.value.publishers.byStatus?.[status] || 0
  return `${(count / stats.value.publishers.total) * 100}%`
}

// Drawer computed
const drawerYearsPublishing = computed(() => {
  if (publisherDetail.value?.stats.yearsPublishing != null) {
    const y = publisherDetail.value.stats.yearsPublishing
    return y < 1 ? '< 1' : Math.round(y).toString()
  }
  if (!selectedPublisher.value?.oldestPostDate) return null
  const oldest = new Date(selectedPublisher.value.oldestPostDate)
  const now = new Date()
  const years = (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return years < 1 ? '< 1' : Math.round(years).toString()
})

const drawerPostsPerMonth = computed(() => {
  if (publisherDetail.value?.stats.postsPerMonth != null) {
    return Math.round(publisherDetail.value.stats.postsPerMonth).toString()
  }
  if (!selectedPublisher.value?.postCount || !selectedPublisher.value?.oldestPostDate) return null
  const oldest = new Date(selectedPublisher.value.oldestPostDate)
  const now = new Date()
  const months = (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  if (months < 1) return selectedPublisher.value.postCount.toString()
  return Math.round(selectedPublisher.value.postCount / months).toString()
})

const hasSocialLinks = computed(() => {
  const links = selectedPublisher.value?.socialLinks as SocialLinks | null
  if (!links) return false
  return Object.values(links).some(v => !!v)
})

// Drawer actions
const openDrawer = async (pub: Publisher) => {
  selectedPublisher.value = pub
  publisherDetail.value = null
  drawerOpen.value = true
  detailLoading.value = true
  try {
    publisherDetail.value = await $fetch<PublisherDetail>(`/api/admin/pipeline/publishers/${pub.id}`)
  } catch { /* ignore */ }
  finally { detailLoading.value = false }
}

const closeDrawer = () => {
  drawerOpen.value = false
}

// Fetch
const fetchPublishers = async () => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page.toString())
    params.append('limit', pagination.value.limit.toString())

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (statusFilter.value) params.append('status', statusFilter.value.toString())
    if (wordpressFilter.value) params.append('wordpress', wordpressFilter.value.toString())
    if (networkFilter.value) params.append('network', networkFilter.value.toString())
    if (hasEmailFilter.value) params.append('hasEmail', hasEmailFilter.value.toString())

    const response = await $fetch<{ data: Publisher[]; pagination: Pagination }>(
      `/api/admin/pipeline/publishers?${params.toString()}`
    )

    publishers.value = response.data
    pagination.value = response.pagination
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load leads.'
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    stats.value = await $fetch<Stats>('/api/admin/pipeline/stats')
  } catch {
    // Non-critical, stats just won't show
  }
}

const runScrape = async () => {
  scraping.value = true
  scrapeResult.value = null

  try {
    const result = await $fetch<{
      success: boolean
      totalPublishers: number
      inserted: number
      updated: number
    }>('/api/admin/pipeline/scrape-sellers', { method: 'POST' })

    scrapeResult.value = {
      success: true,
      message: `Discovered ${result.totalPublishers.toLocaleString()} publishers (${result.inserted} new, ${result.updated} updated)`,
    }

    await Promise.all([fetchPublishers(), fetchStats()])
  } catch (err: any) {
    scrapeResult.value = {
      success: false,
      message: err?.data?.message || 'Scrape failed',
    }
  } finally {
    scraping.value = false
  }
}

const runPipeline = async () => {
  pipelineRunning.value = true
  scrapeResult.value = null

  try {
    const result = await $fetch<{
      success: boolean
      jobId: number
      status: string
      limit: number
    }>('/api/admin/pipeline/run?limit=50', { method: 'POST' })

    scrapeResult.value = {
      success: true,
      message: `Pipeline started (Job #${result.jobId}): probe → enrich → contacts for ${result.limit} publishers. Check Pipeline page for progress.`,
    }
  } catch (err: any) {
    scrapeResult.value = {
      success: false,
      message: err?.data?.message || 'Pipeline failed to start',
    }
  } finally {
    pipelineRunning.value = false
  }
}

// Handlers
const handleSearch = () => { pagination.value.page = 1; fetchPublishers() }
const handleFilterChange = () => { pagination.value.page = 1; fetchPublishers() }
const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchPublishers()
  }
}

// Helpers
const statusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'badge-ghost',
    plugins_scraped: 'badge-info badge-outline',
    enriched: 'badge-warning badge-outline',
    contacts_scraped: 'badge-accent badge-outline',
    complete: 'badge-success badge-outline',
    failed: 'badge-error badge-outline',
  }
  return map[status] || 'badge-ghost'
}

const categoryBadgeClass = (category: string): string => {
  const map: Record<string, string> = {
    food: 'badge-success badge-outline',
    diy: 'badge-info badge-outline',
    lifestyle: 'badge-warning badge-outline',
    travel: 'badge-accent badge-outline',
  }
  return map[category] || 'badge-outline'
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Watchers
watch([searchQuery, statusFilter, wordpressFilter, networkFilter, hasEmailFilter], () => {
  pagination.value.page = 1
  fetchPublishers()
})

onMounted(() => {
  fetchPublishers()
  fetchStats()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
