<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1800px] mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">CRM</span>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Contact Management</span>
        </div>
        <div class="flex items-center justify-between">
          <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
            Outreach
          </h1>
          <button
            class="btn btn-primary btn-sm"
            :disabled="generating"
            @click="generateOutreach"
          >
            <span v-if="generating" class="loading loading-spinner loading-xs"></span>
            <SparklesIcon v-else class="w-4 h-4" />
            {{ generating ? 'Generating...' : 'Generate Outreach' }}
          </button>
        </div>
      </div>

      <!-- Sub Navigation -->
      <div class="flex gap-1 mb-6">
        <NuxtLink to="/crm/leads" class="btn btn-sm btn-ghost">Leads</NuxtLink>
        <NuxtLink to="/crm/outreach" class="btn btn-sm btn-primary">Outreach</NuxtLink>
        <NuxtLink to="/crm/pipeline" class="btn btn-sm btn-ghost">Pipeline</NuxtLink>
      </div>

      <!-- Segment Tabs -->
      <div class="flex flex-wrap gap-1 mb-6">
        <button
          class="btn btn-sm"
          :class="segmentFilter === null ? 'btn-primary' : 'btn-ghost'"
          @click="setSegmentFilter(null)"
        >
          All
          <span v-if="segmentCounts" class="ml-1 text-xs opacity-60">({{ totalCount }})</span>
        </button>
        <button
          v-for="seg in segmentTabs"
          :key="seg.value"
          class="btn btn-sm"
          :class="segmentFilter === seg.value ? 'btn-primary' : 'btn-ghost'"
          @click="setSegmentFilter(seg.value)"
        >
          {{ seg.label }}
          <span v-if="segmentCounts" class="ml-1 text-xs opacity-60">({{ segmentCounts[seg.value] || 0 }})</span>
        </button>
      </div>

      <!-- Master-Detail Layout -->
      <div class="flex gap-6">
        <!-- Left: Table -->
        <div class="flex-1 min-w-0">
          <!-- Search + Sort -->
          <div class="mb-4 flex gap-2">
            <div class="flex-1">
              <AdminSearchInput
                v-model="searchQuery"
                placeholder="Search by name, email, or domain..."
                :debounce="300"
                @search="handleSearch"
              />
            </div>
            <button
              class="btn btn-sm btn-outline gap-1"
              :class="sortBy === 'paidPlugins' ? 'btn-active' : ''"
              @click="toggleSort"
              title="Sort by paid plugin count"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              Paid Plugins
            </button>
          </div>

          <!-- Outreach Table -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm hover:shadow-md hover:border-base-300 transition-all duration-300">
            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-4">
                <span class="loading loading-spinner loading-lg text-primary"></span>
                <p class="text-sm text-base-content/50 font-light tracking-wide">Loading outreach records...</p>
              </div>
            </div>

            <!-- Error -->
            <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-center px-6">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-error/10 border border-error/20 mb-4">
                <ExclamationCircleIcon class="w-8 h-8 text-error" />
              </div>
              <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">Unable to Load Outreach</h3>
              <p class="text-sm text-base-content/60 mb-4">{{ error }}</p>
              <button class="btn btn-outline btn-sm" @click="fetchOutreach">Try Again</button>
            </div>

            <!-- Table -->
            <div v-else-if="outreachRecords.length > 0">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="border-b border-base-300/50">
                      <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Contact</th>
                      <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Segment</th>
                      <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Stage</th>
                      <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Rating</th>
                      <th class="text-left py-4 px-6 text-xs font-medium text-base-content/50 uppercase tracking-wider">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="record in outreachRecords"
                      :key="record.id"
                      class="border-b border-base-300/30 last:border-b-0 transition-colors cursor-pointer"
                      :class="selectedRecord?.id === record.id ? 'bg-primary/5' : 'hover:bg-base-50'"
                      @click="selectRecord(record)"
                    >
                      <!-- Contact -->
                      <td class="py-3 px-6">
                        <div class="flex items-center gap-2.5">
                          <img
                            v-if="record.contactEmail"
                            :src="getGravatarUrl(record.contactEmail, 24)"
                            class="w-6 h-6 rounded-full flex-shrink-0"
                            alt=""
                          />
                          <div class="w-6 h-6 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0" v-else>
                            <UserIcon class="w-3 h-3 text-base-content/30" />
                          </div>
                          <div class="min-w-0">
                            <div class="font-medium text-sm text-base-content truncate">{{ record.contactName || 'Unknown' }}</div>
                            <div class="text-xs text-base-content/50 truncate">{{ record.contactEmail || record.publisherDomain || '' }}</div>
                          </div>
                        </div>
                      </td>

                      <!-- Segment -->
                      <td class="py-3 px-6">
                        <div class="flex items-center gap-1.5">
                          <span v-if="record.segment" class="badge badge-sm" :class="segmentBadgeClass(record.segment)">
                            {{ segmentLabel(record.segment) }}
                          </span>
                          <span v-else class="text-sm text-base-content/40">&mdash;</span>
                          <span v-if="record.paidPluginCount" class="text-[10px] text-base-content/40" :title="`${record.paidPluginCount} paid plugins`">
                            {{ record.paidPluginCount }}$
                          </span>
                        </div>
                      </td>

                      <!-- Stage (pipeline dots) -->
                      <td class="py-3 px-6">
                        <div class="flex items-center gap-0">
                          <template v-for="(s, idx) in stages" :key="s">
                            <div
                              class="w-2.5 h-2.5 rounded-full"
                              :class="stageIndex(record.stage) >= idx ? 'bg-primary' : 'bg-base-300'"
                              :title="s"
                            ></div>
                            <div
                              v-if="idx < stages.length - 1"
                              class="w-3 h-0.5"
                              :class="stageIndex(record.stage) > idx ? 'bg-primary' : 'bg-base-300'"
                            ></div>
                          </template>
                        </div>
                      </td>

                      <!-- Rating -->
                      <td class="py-3 px-6">
                        <div v-if="record.rating" class="text-sm text-amber-500 tracking-tight">
                          <span v-for="i in 5" :key="i">{{ i <= record.rating ? '\u2605' : '\u2606' }}</span>
                        </div>
                        <span v-else class="text-sm text-base-content/40">&mdash;</span>
                      </td>

                      <!-- Updated -->
                      <td class="py-3 px-6">
                        <span v-if="record.updatedAt" class="text-sm text-base-content/70">{{ relativeDate(record.updatedAt) }}</span>
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
                  Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, pagination.total) }} of {{ pagination.total.toLocaleString() }} records
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
                <EnvelopeIcon class="w-8 h-8" />
              </div>
              <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">No Outreach Records</h3>
              <p class="text-sm text-base-content/50 mb-4">Generate outreach records from your enriched leads to start tracking contact stages.</p>
              <button class="btn btn-primary btn-sm" :disabled="generating" @click="generateOutreach">
                Generate Outreach
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Detail Panel -->
        <div v-if="selectedRecord" class="w-[420px] flex-shrink-0">
          <div class="sticky top-8">
            <div class="bg-base-100 rounded-xl border-l-2 border border-base-300/50 shadow-sm overflow-y-auto max-h-[calc(100vh-8rem)]">
              <!-- Detail Loading -->
              <div v-if="detailLoading" class="flex items-center justify-center py-16">
                <span class="loading loading-spinner loading-lg text-primary"></span>
              </div>

              <div v-else class="p-5 space-y-5">
                <!-- Contact -->
                <div>
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Contact</div>
                  <div class="bg-base-200/50 rounded-lg p-3 flex items-start gap-3">
                    <img
                      v-if="selectedRecord.contactEmail"
                      :src="getGravatarUrl(selectedRecord.contactEmail, 48)"
                      class="w-12 h-12 rounded-full flex-shrink-0"
                      alt=""
                    />
                    <div class="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center flex-shrink-0" v-else>
                      <UserIcon class="w-6 h-6 text-base-content/30" />
                    </div>
                    <div class="space-y-1 min-w-0">
                      <div class="font-medium text-base-content text-sm">
                        {{ selectedRecord.contactName || 'Unknown' }}
                      </div>
                      <div v-if="selectedRecord.contactEmail" class="flex items-center gap-2">
                        <EnvelopeIcon class="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <a :href="`mailto:${selectedRecord.contactEmail}`" class="text-sm text-primary hover:underline truncate">
                          {{ selectedRecord.contactEmail }}
                        </a>
                      </div>
                      <div v-if="selectedRecord.publisherDomain" class="flex items-center gap-2">
                        <GlobeAltIcon class="w-3.5 h-3.5 text-base-content/40 flex-shrink-0" />
                        <a :href="`https://${selectedRecord.publisherDomain}`" target="_blank" rel="noopener noreferrer" class="text-sm text-primary hover:underline flex items-center gap-1">
                          {{ selectedRecord.publisherDomain }}
                          <LinkIcon class="w-3 h-3 text-base-content/30" />
                        </a>
                      </div>
                      <div class="flex items-center gap-2 mt-1">
                        <span v-if="selectedRecord.segment" class="badge badge-sm" :class="segmentBadgeClass(selectedRecord.segment)">
                          {{ segmentLabel(selectedRecord.segment) }}
                        </span>
                        <span v-if="selectedRecord.contactSource" class="badge badge-sm badge-outline">
                          {{ selectedRecord.contactSource.replace(/_/g, ' ') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Stage Selector -->
                <div>
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-3">Stage</div>
                  <div class="flex items-center gap-0">
                    <template v-for="(s, idx) in stages" :key="s">
                      <button
                        class="flex flex-col items-center gap-1 group"
                        @click="updateStage(s)"
                        :title="s"
                      >
                        <div
                          class="w-4 h-4 rounded-full border-2 transition-colors cursor-pointer"
                          :class="stageIndex(selectedRecord.stage) >= idx
                            ? 'bg-primary border-primary'
                            : 'bg-base-100 border-base-300 group-hover:border-primary/50'"
                        ></div>
                        <span class="text-[10px] text-base-content/50 capitalize">{{ s }}</span>
                      </button>
                      <div
                        v-if="idx < stages.length - 1"
                        class="w-8 h-0.5 mb-4"
                        :class="stageIndex(selectedRecord.stage) > idx ? 'bg-primary' : 'bg-base-300'"
                      ></div>
                    </template>
                  </div>
                </div>

                <!-- Rating -->
                <div>
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Rating</div>
                  <div class="flex items-center gap-1">
                    <button
                      v-for="i in 5"
                      :key="i"
                      class="text-2xl transition-colors cursor-pointer hover:scale-110"
                      :class="i <= (selectedRecord.rating || 0) ? 'text-amber-500' : 'text-base-300 hover:text-amber-300'"
                      @click="updateRating(i)"
                    >
                      {{ i <= (selectedRecord.rating || 0) ? '\u2605' : '\u2606' }}
                    </button>
                  </div>
                </div>

                <!-- Notes -->
                <div>
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Notes</div>
                  <textarea
                    v-model="panelNotes"
                    class="textarea textarea-bordered w-full min-h-[100px] text-sm"
                    placeholder="Add notes about this contact..."
                    @blur="saveNotes"
                  ></textarea>
                </div>

                <!-- Create Studio -->
                <div v-if="publisherDetail?.publisher.studioData">
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Create Studio</div>
                  <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-base-content">Create User</span>
                      <div class="flex gap-1.5">
                        <span v-if="publisherDetail.publisher.studioData.isActive" class="badge badge-xs badge-success">Active</span>
                        <span v-else class="badge badge-xs badge-ghost">Inactive</span>
                        <span v-if="publisherDetail.publisher.studioData.isLegacy" class="badge badge-xs badge-warning">Legacy</span>
                        <span v-else class="badge badge-xs badge-info">v2.0+</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-base-content/40">Version</span>
                        <div class="font-medium text-base-content">{{ publisherDetail.publisher.studioData.createVersion || 'Unknown' }}</div>
                      </div>
                      <div>
                        <span class="text-base-content/40">Subscription</span>
                        <div class="font-medium text-base-content capitalize">{{ publisherDetail.publisher.studioData.subscriptionTier || 'Free' }}</div>
                      </div>
                      <div>
                        <span class="text-base-content/40">Last Active</span>
                        <div class="font-medium text-base-content">
                          {{ publisherDetail.publisher.studioData.lastActiveAt ? relativeDate(publisherDetail.publisher.studioData.lastActiveAt) : 'Never' }}
                        </div>
                      </div>
                      <div>
                        <span class="text-base-content/40">Status</span>
                        <div class="font-medium text-base-content capitalize">{{ publisherDetail.publisher.studioData.subscriptionStatus || 'Free' }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else-if="publisherDetail?.publisher.createStudioSiteId">
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Create Studio</div>
                  <div class="text-sm text-base-content/60">Linked (Site #{{ publisherDetail.publisher.createStudioSiteId }})</div>
                </div>
                <!-- Fallback: show outreach-level studioData when no publisherDetail -->
                <div v-else-if="!publisherDetail && selectedRecord.publisherStudioData">
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Create Studio</div>
                  <div class="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-medium text-base-content">Create User</span>
                      <div class="flex gap-1.5">
                        <span v-if="selectedRecord.publisherStudioData.isActive" class="badge badge-xs badge-success">Active</span>
                        <span v-else class="badge badge-xs badge-ghost">Inactive</span>
                        <span v-if="selectedRecord.publisherStudioData.isLegacy" class="badge badge-xs badge-warning">Legacy</span>
                        <span v-else class="badge badge-xs badge-info">v2.0+</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-base-content/40">Version</span>
                        <div class="font-medium text-base-content">{{ selectedRecord.publisherStudioData.createVersion || 'Unknown' }}</div>
                      </div>
                      <div>
                        <span class="text-base-content/40">Subscription</span>
                        <div class="font-medium text-base-content capitalize">{{ selectedRecord.publisherStudioData.subscriptionTier || 'Free' }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Publishing Stats -->
                <div v-if="publisherDetail">
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Publishing Stats</div>
                  <div class="grid grid-cols-3 gap-3">
                    <div class="bg-base-200/50 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-base-content">{{ publisherDetail.publisher.postCount?.toLocaleString() || '&mdash;' }}</div>
                      <div class="text-[10px] text-base-content/50 uppercase tracking-wider">Posts</div>
                    </div>
                    <div class="bg-base-200/50 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-base-content">{{ detailYearsPublishing || '&mdash;' }}</div>
                      <div class="text-[10px] text-base-content/50 uppercase tracking-wider">Years</div>
                    </div>
                    <div class="bg-base-200/50 rounded-lg p-3 text-center">
                      <div class="text-lg font-bold text-base-content">{{ detailPostsPerMonth || '&mdash;' }}</div>
                      <div class="text-[10px] text-base-content/50 uppercase tracking-wider">Posts/Mo</div>
                    </div>
                  </div>
                </div>

                <!-- Plugin Stack -->
                <div v-if="publisherDetail?.plugins?.length">
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">
                    Plugin Stack
                    <span class="text-base-content/30 normal-case tracking-normal font-normal ml-1">{{ publisherDetail.plugins.length }} plugins</span>
                  </div>

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
                  <div class="space-y-1.5">
                    <div v-for="plugin in publisherDetail.plugins" :key="plugin.namespace"
                      class="py-2 px-3 rounded-lg bg-base-200/30 hover:bg-base-200/60 transition-colors">
                      <div class="flex items-start justify-between gap-2">
                        <div class="min-w-0">
                          <div class="flex items-center gap-1.5">
                            <a v-if="plugin.wpUrl || plugin.homepageUrl"
                              :href="plugin.wpUrl || plugin.homepageUrl"
                              target="_blank" rel="noopener noreferrer"
                              class="text-sm font-medium text-base-content hover:text-primary transition-colors"
                            >
                              {{ plugin.name || plugin.namespace }}
                            </a>
                            <span v-else class="text-sm font-medium text-base-content">{{ plugin.name || plugin.namespace }}</span>
                            <LinkIcon v-if="plugin.wpUrl || plugin.homepageUrl" class="w-3 h-3 text-base-content/30 flex-shrink-0" />
                          </div>
                          <div v-if="plugin.description" class="text-xs text-base-content/50 mt-0.5 line-clamp-1">
                            {{ plugin.description }}
                          </div>
                          <div class="flex items-center gap-3 mt-1">
                            <span v-if="plugin.activeInstalls" class="text-[10px] text-base-content/40">
                              {{ formatInstalls(plugin.activeInstalls) }} installs
                            </span>
                            <span v-if="plugin.rating" class="text-[10px] text-base-content/40">
                              {{ (plugin.rating / 20).toFixed(1) }}/5 rating
                            </span>
                            <span v-if="plugin.category" class="text-[10px] text-base-content/40 uppercase">
                              {{ plugin.category }}
                            </span>
                          </div>
                        </div>
                        <div class="flex flex-col gap-1 flex-shrink-0 items-end">
                          <span v-if="plugin.isCompetitor" class="badge badge-xs badge-error badge-outline">competitor</span>
                          <span v-if="plugin.isPaid" class="badge badge-xs badge-primary badge-outline">paid</span>
                          <span v-if="plugin.replaceableByCreate" class="badge badge-xs badge-warning badge-outline">replaceable</span>
                          <span v-if="!plugin.wpUrl && !plugin.isCompetitor && !plugin.isPaid" class="badge badge-xs badge-ghost">unknown</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Social Links -->
                <div v-if="hasSocialLinks">
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Social Links</div>
                  <div class="flex flex-wrap gap-2">
                    <a
                      v-for="(url, platform) in activeSocialLinks"
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

                <!-- Top Content -->
                <div v-if="publisherDetail?.publisher.topContent?.length">
                  <div class="text-xs font-medium text-base-content/50 uppercase tracking-wider mb-2">Top Content</div>
                  <div class="space-y-1.5">
                    <div
                      v-for="(item, idx) in (publisherDetail.publisher.topContent as TopContentEntry[])"
                      :key="idx"
                      class="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-base-200/50 transition-colors"
                    >
                      <span class="text-sm text-base-content truncate">{{ item.title }}</span>
                      <span v-if="item.comments" class="text-xs text-base-content/40 flex-shrink-0">{{ item.comments }} comments</span>
                    </div>
                  </div>
                </div>

                <!-- Publisher Link -->
                <div v-if="selectedRecord.publisherId">
                  <NuxtLink
                    :to="`/crm/leads?publisher=${selectedRecord.publisherId}`"
                    class="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View in Leads
                    <ChevronRightIcon class="w-4 h-4" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Toast -->
      <div v-if="toastMessage" class="toast toast-end toast-bottom">
        <div class="alert" :class="toastMessage.success ? 'alert-success' : 'alert-error'">
          <span>{{ toastMessage.message }}</span>
          <button class="btn btn-ghost btn-xs" @click="toastMessage = null">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getGravatarUrl } from '~/composables/useAvatar'
import {
  SparklesIcon,
  GlobeAltIcon,
  EnvelopeIcon,
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

interface OutreachRecord {
  id: number
  contactType: string
  publisherId: number | null
  userId: number | null
  segment: string | null
  status: string
  stage: string
  rating: number | null
  paidPluginCount: number | null
  notes: string | null
  lastContactedAt: string | null
  createdAt: string
  updatedAt: string | null
  // Joined fields
  publisherDomain: string | null
  publisherSiteName: string | null
  publisherSiteCategory: string | null
  publisherStudioData: any | null
  contactEmail: string | null
  contactName: string | null
  contactSource: string | null
}

interface PublisherDetail {
  publisher: {
    id: number
    domain: string
    siteName: string | null
    postCount: number | null
    oldestPostDate: string | null
    newestPostDate: string | null
    topContent: TopContentEntry[] | null
    socialLinks: SocialLinks | null
    contactEmail: string | null
    contactName: string | null
    contactSource: string | null
    createStudioSiteId: number | null
    studioData: {
      createVersion: string | null
      lastActiveAt: string | null
      subscriptionTier: string | null
      subscriptionStatus: string | null
      isActive: boolean
      isLegacy: boolean
    } | null
  }
  plugins: Array<{
    namespace: string
    name: string | null
    category: string | null
    isPaid: boolean
    isCompetitor: boolean
    replaceableByCreate: boolean
    wpSlug: string | null
    wpUrl: string | null
    homepageUrl: string | null
    description: string | null
    activeInstalls: number | null
    rating: number | null
  }>
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

const route = useRoute()
const router = useRouter()

const stages = ['queued', 'contacted', 'responded', 'engaged'] as const

const segmentTabs = [
  { value: 'legacy', label: 'Legacy' },
  { value: 'current', label: 'v2.0+' },
  { value: 'pro', label: 'Pro' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'wprm', label: 'WPRM' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'paid_plugins', label: 'Paid Plugins' },
  { value: 'no_recipe_plugin', label: 'No Recipe' },
  { value: 'other', label: 'Other' },
]

// State
const outreachRecords = ref<OutreachRecord[]>([])
const pagination = ref<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
const segmentCounts = ref<Record<string, number> | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const generating = ref(false)
const toastMessage = ref<{ success: boolean; message: string } | null>(null)

// Filters — initialized from URL
const segmentFilter = ref<string | null>((route.query.segment as string) || null)
const searchQuery = ref((route.query.search as string) || '')
const sortBy = ref<string>((route.query.sort as string) || 'createdAt')

// Detail panel
const selectedRecord = ref<OutreachRecord | null>(null)
const selectedId = ref<number | null>(route.query.id ? Number(route.query.id) : null)
const publisherDetail = ref<PublisherDetail | null>(null)
const detailLoading = ref(false)
const panelNotes = ref('')

// Pagination helpers
const startIndex = computed(() => (pagination.value.page - 1) * pagination.value.limit)
const endIndex = computed(() => startIndex.value + pagination.value.limit)

const totalCount = computed(() => {
  if (!segmentCounts.value) return 0
  return Object.values(segmentCounts.value).reduce((sum, n) => sum + n, 0)
})

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

// Detail panel computed
const detailYearsPublishing = computed(() => {
  if (publisherDetail.value?.stats.yearsPublishing != null) {
    const y = publisherDetail.value.stats.yearsPublishing
    return y < 1 ? '< 1' : Math.round(y).toString()
  }
  if (!publisherDetail.value?.publisher.oldestPostDate) return null
  const oldest = new Date(publisherDetail.value.publisher.oldestPostDate)
  const now = new Date()
  const years = (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return years < 1 ? '< 1' : Math.round(years).toString()
})

const detailPostsPerMonth = computed(() => {
  if (publisherDetail.value?.stats.postsPerMonth != null) {
    return Math.round(publisherDetail.value.stats.postsPerMonth).toString()
  }
  if (!publisherDetail.value?.publisher.postCount || !publisherDetail.value?.publisher.oldestPostDate) return null
  const oldest = new Date(publisherDetail.value.publisher.oldestPostDate)
  const now = new Date()
  const months = (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  if (months < 1) return publisherDetail.value.publisher.postCount.toString()
  return Math.round(publisherDetail.value.publisher.postCount / months).toString()
})

const hasSocialLinks = computed(() => {
  const links = publisherDetail.value?.publisher.socialLinks as SocialLinks | null
  if (!links) return false
  return Object.values(links).some(v => !!v)
})

const activeSocialLinks = computed(() => {
  const links = publisherDetail.value?.publisher.socialLinks as SocialLinks | null
  if (!links) return {}
  return Object.fromEntries(Object.entries(links).filter(([, v]) => !!v))
})

// URL state persistence
const updateUrl = () => {
  const query: Record<string, string> = {}
  if (segmentFilter.value) query.segment = segmentFilter.value
  if (searchQuery.value) query.search = searchQuery.value
  if (sortBy.value !== 'createdAt') query.sort = sortBy.value
  if (selectedRecord.value) query.id = String(selectedRecord.value.id)
  router.replace({ query })
}

// Helpers
const segmentBadgeClass = (segment: string): string => {
  const map: Record<string, string> = {
    legacy: 'badge-error',
    current: 'badge-info',
    pro: 'badge-primary',
    inactive: 'badge-ghost',
    wprm: 'badge-success',
    competitor: 'badge-warning',
    paid_plugins: 'badge-secondary',
    no_recipe_plugin: 'badge-accent',
    other: 'badge-ghost',
  }
  return map[segment] || 'badge-ghost'
}

const segmentLabel = (segment: string): string => {
  const map: Record<string, string> = {
    legacy: 'Legacy',
    current: 'v2.0+',
    pro: 'Pro',
    inactive: 'Inactive',
    wprm: 'WPRM',
    competitor: 'Competitor',
    paid_plugins: 'Paid Plugins',
    no_recipe_plugin: 'No Recipe',
    other: 'Other',
  }
  return map[segment] || segment
}

const stageIndex = (stage: string): number => {
  return stages.indexOf(stage as typeof stages[number])
}

const relativeDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatInstalls = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return n.toString()
}

const setSegmentFilter = (value: string | null) => {
  segmentFilter.value = value
  pagination.value.page = 1
  fetchOutreach()
  updateUrl()
}

// Record selection & detail fetching
const selectRecord = (record: OutreachRecord) => {
  selectedRecord.value = record
  panelNotes.value = record.notes || ''
  publisherDetail.value = null
  updateUrl()
  fetchDetail(record)
}

const fetchDetail = async (record: OutreachRecord) => {
  if (!record.publisherId) return
  detailLoading.value = true
  try {
    publisherDetail.value = await $fetch<PublisherDetail>(`/api/admin/pipeline/publishers/${record.publisherId}`)
  } catch {
    // Non-critical — panel still shows outreach-level data
  } finally {
    detailLoading.value = false
  }
}

// Data fetching
const fetchOutreach = async () => {
  loading.value = true
  error.value = null

  try {
    const params = new URLSearchParams()
    params.append('page', pagination.value.page.toString())
    params.append('limit', '50')
    if (segmentFilter.value) params.append('segment', segmentFilter.value)
    if (searchQuery.value) params.append('search', searchQuery.value)
    if (sortBy.value !== 'createdAt') params.append('sort', sortBy.value)

    const response = await $fetch<{
      data: OutreachRecord[]
      pagination: Pagination
      segmentCounts: Record<string, number>
    }>(`/api/admin/pipeline/outreach?${params}`)

    outreachRecords.value = response.data
    pagination.value = response.pagination
    segmentCounts.value = response.segmentCounts

    // Auto-select record from URL if present
    if (selectedId.value && !selectedRecord.value) {
      const found = outreachRecords.value.find(r => r.id === selectedId.value)
      if (found) {
        selectRecord(found)
      }
      selectedId.value = null
    }
  } catch (err: any) {
    error.value = err?.data?.message || 'Failed to load outreach records.'
  } finally {
    loading.value = false
  }
}

const generateOutreach = async () => {
  generating.value = true
  toastMessage.value = null

  try {
    const result = await $fetch<{ success: boolean; message?: string; generated?: number }>(
      '/api/admin/pipeline/outreach/generate',
      { method: 'POST' }
    )

    toastMessage.value = {
      success: true,
      message: result.message || `Generated ${result.generated || 0} outreach records.`,
    }

    await fetchOutreach()
  } catch (err: any) {
    toastMessage.value = {
      success: false,
      message: err?.data?.message || 'Failed to generate outreach records.',
    }
  } finally {
    generating.value = false
  }
}

const patchRecord = async (id: number, data: Partial<OutreachRecord>) => {
  try {
    const updated = await $fetch<OutreachRecord>(`/api/admin/pipeline/outreach/${id}`, {
      method: 'PATCH',
      body: data,
    })

    // Update in list
    const idx = outreachRecords.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      outreachRecords.value[idx] = { ...outreachRecords.value[idx], ...updated }
    }

    // Update selected record
    if (selectedRecord.value?.id === id) {
      selectedRecord.value = { ...selectedRecord.value, ...updated }
    }
  } catch (err: any) {
    toastMessage.value = {
      success: false,
      message: err?.data?.message || 'Failed to update record.',
    }
  }
}

const updateStage = (stage: string) => {
  if (!selectedRecord.value) return
  selectedRecord.value = { ...selectedRecord.value, stage }
  patchRecord(selectedRecord.value.id, { stage } as Partial<OutreachRecord>)
}

const updateRating = (rating: number) => {
  if (!selectedRecord.value) return
  selectedRecord.value = { ...selectedRecord.value, rating }
  patchRecord(selectedRecord.value.id, { rating } as Partial<OutreachRecord>)
}

const saveNotes = () => {
  if (!selectedRecord.value) return
  if (panelNotes.value === (selectedRecord.value.notes || '')) return
  selectedRecord.value = { ...selectedRecord.value, notes: panelNotes.value }
  patchRecord(selectedRecord.value.id, { notes: panelNotes.value } as Partial<OutreachRecord>)
}

// Handlers
const handleSearch = () => {
  pagination.value.page = 1
  fetchOutreach()
  updateUrl()
}

const toggleSort = () => {
  sortBy.value = sortBy.value === 'paidPlugins' ? 'createdAt' : 'paidPlugins'
  pagination.value.page = 1
  fetchOutreach()
  updateUrl()
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchOutreach()
  }
}

// Watchers
watch(searchQuery, () => {
  pagination.value.page = 1
  fetchOutreach()
  updateUrl()
})

onMounted(() => {
  fetchOutreach()
})
</script>
