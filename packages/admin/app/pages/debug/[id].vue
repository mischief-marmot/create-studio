<template>
  <div class="min-h-screen">
    <!-- Header -->
    <div class="mb-8">
      <button
        class="inline-flex items-center gap-2 text-sm text-base-content/60 hover:text-base-content transition-colors mb-6 font-medium tracking-wide group"
        @click="navigateBack"
        aria-label="Back to site"
      >
        <ArrowLeftIcon class="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>{{ siteName || 'Site' }}</span>
      </button>

      <div class="space-y-2">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase">
          <span class="text-base-content/50">Site Debug</span>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">ID {{ siteId }}</span>
        </div>
        <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
          Debug Dashboard
        </h1>
        <p class="text-base-content/60 text-sm mt-2">Live diagnostics from <strong>{{ siteName || siteUrl || `site #${siteId}` }}</strong> via webhook.</p>
      </div>

      <!-- Download debug info -->
      <button
        v-if="debugData"
        class="btn btn-sm btn-outline mt-4"
        @click="downloadDebugInfo"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Download Debug Info
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !debugData" class="flex items-center justify-center min-h-[40vh]">
      <div class="flex flex-col items-center gap-4">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="text-sm text-base-content/50 font-light tracking-wide">Querying site...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert alert-error mb-6">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div>
        <span class="font-medium">{{ error }}</span>
        <p v-if="errorDetails" class="text-sm opacity-70 mt-1">{{ errorDetails }}</p>
      </div>
      <button class="btn btn-sm btn-ghost" @click="fetchDebugData">Retry</button>
    </div>

    <!-- Update Banner -->
    <div v-if="needsUpdate" class="alert alert-warning mb-6">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span class="font-medium">The Create plugin on this site may need to be updated for full debug support.</span>
    </div>

    <!-- Tabs -->
    <div v-if="debugData" class="space-y-6">
      <div role="tablist" class="tabs tabs-bordered">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          role="tab"
          class="tab gap-2"
          :class="{ 'tab-active': activeTab === tab.id }"
          @click="setActiveTab(tab.id)"
        >
          <component :is="tab.icon" class="w-4 h-4" />
          {{ tab.name }}
          <span v-if="tab.badge" class="badge badge-xs" :class="tab.badgeClass || 'badge-primary'">{{ tab.badge }}</span>
        </button>
      </div>

      <!-- Environment Tab -->
      <div v-show="activeTab === 'environment'">
        <!-- Version Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div v-for="card in versionCards" :key="card.label" class="bg-base-100 rounded-xl border border-base-300/50 p-5 shadow-sm">
            <p class="text-base-content/50 text-xs tracking-wide uppercase mb-1">{{ card.label }}</p>
            <p class="text-base-content text-xl font-mono">{{ card.value || 'N/A' }}</p>
          </div>
        </div>

        <!-- Features & Subscription -->
        <div v-if="debugData.features" class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Subscription & Card Stats -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
            <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
              Subscription & Content
            </h3>
            <div class="space-y-1">
              <div class="flex justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Subscription Tier</span>
                <span class="text-sm font-medium" :class="tierClass">{{ debugData.features.subscription_tier || 'free' }}</span>
              </div>
              <div class="flex justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Pro Edition</span>
                <span class="text-sm font-medium" :class="debugData.features.is_pro ? 'text-success' : ''">{{ debugData.features.is_pro ? 'Yes' : 'No' }}</span>
              </div>
              <div v-if="debugData.features.card_stats" class="flex justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Total Cards</span>
                <span class="text-sm text-base-content font-medium font-mono">{{ debugData.features.card_stats.total || 0 }}</span>
              </div>
              <template v-if="debugData.features.card_stats">
                <div v-for="(count, type) in debugData.features.card_stats" :key="type" class="flex justify-between py-3 border-b border-base-300/30" v-show="type !== 'total'">
                  <span class="text-sm text-base-content/60 capitalize">{{ type }} Cards</span>
                  <span class="text-sm text-base-content/70 font-mono">{{ count }}</span>
                </div>
              </template>
            </div>
          </div>

          <!-- Amazon Status -->
          <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
            <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
              Amazon PA-API
            </h3>
            <div v-if="debugData.features.amazon" class="space-y-1">
              <div class="flex justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Enabled</span>
                <span class="text-sm font-medium" :class="debugData.features.amazon.enabled ? 'text-success' : ''">{{ debugData.features.amazon.enabled ? 'Yes' : 'No' }}</span>
              </div>
              <div class="flex justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Credentials Configured</span>
                <StatusDot :ok="debugData.features.amazon.credentials_set" />
              </div>
              <div class="flex justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Access Key</span>
                <StatusDot :ok="debugData.features.amazon.has_access_key" />
              </div>
              <div class="flex justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Secret Key</span>
                <StatusDot :ok="debugData.features.amazon.has_secret_key" />
              </div>
              <div class="flex justify-between py-3 border-b border-base-300/30">
                <span class="text-sm text-base-content/60">Store Tag</span>
                <StatusDot :ok="debugData.features.amazon.has_store_tag" />
              </div>
            </div>
            <p v-else class="text-base-content/40 text-sm py-4">Not available</p>
          </div>
        </div>

        <!-- Server Info -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
          <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
            Server Configuration
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
            <div v-for="item in serverInfoItems" :key="item.label" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">{{ item.label }}</span>
              <span class="text-sm text-base-content font-medium">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- System Checks -->
        <div v-if="debugData.compatibility?.system_checks" class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
          <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
            System Checks
          </h3>
          <div class="space-y-1">
            <div v-for="(check, key) in debugData.compatibility.system_checks" :key="key" class="flex justify-between py-3 border-b border-base-300/30">
              <div>
                <span class="text-sm text-base-content/60">{{ formatCheckName(key) }}</span>
                <span v-if="check.message" class="text-xs text-warning ml-2">{{ check.message }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-mono text-base-content/70">{{ check.value }}</span>
                <span class="size-2 rounded-full" :class="check.ok ? 'bg-success' : 'bg-error'"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Connection Status -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
          <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
            Studio Connection
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1">
            <div v-for="item in connectionItems" :key="item.label" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">{{ item.label }}</span>
              <span class="text-sm font-medium" :class="item.class || 'text-base-content'">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Compatibility Tab -->
      <div v-show="activeTab === 'compatibility'">
        <!-- Ad Network -->
        <div v-if="debugData.compatibility?.ad_network" class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
          <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
            Ad Network
          </h3>
          <div class="space-y-1">
            <div class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">Network</span>
              <span class="text-sm font-medium capitalize" :class="adNetworkClass">{{ debugData.compatibility.ad_network.network }}</span>
            </div>
            <div class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">MCP Installed</span>
              <StatusDot :ok="debugData.compatibility.ad_network.mcp_installed" />
            </div>
            <div class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">MCP Authenticated</span>
              <StatusDot :ok="debugData.compatibility.ad_network.mcp_authenticated" />
            </div>
            <div v-if="debugData.compatibility.ad_network.mcp_site_id" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">MCP Site ID</span>
              <span class="text-sm text-base-content font-mono">{{ debugData.compatibility.ad_network.mcp_site_id }}</span>
            </div>
            <div class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">Raptive/Journey Site</span>
              <StatusDot :ok="debugData.compatibility.ad_network.journey_site" />
            </div>
            <div v-if="debugData.compatibility.ad_network.grow_site_uuid" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">Grow Site UUID</span>
              <span class="text-sm text-base-content/70 font-mono text-xs">{{ debugData.compatibility.ad_network.grow_site_uuid }}</span>
            </div>
          </div>
        </div>

        <!-- Caching -->
        <div v-if="debugData.compatibility?.caching" class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
          <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
            Caching
          </h3>
          <div class="space-y-1 mb-4">
            <div class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">External Object Cache</span>
              <StatusDot :ok="debugData.compatibility.caching.object_cache" label-on="Active" label-off="No" />
            </div>
          </div>
          <div v-if="debugData.compatibility.caching.plugins.length" class="flex flex-wrap gap-2">
            <span
              v-for="plugin in debugData.compatibility.caching.plugins"
              :key="plugin"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-info/10 text-info border border-info/20"
            >
              {{ plugin }}
            </span>
          </div>
          <p v-else class="text-base-content/40 text-sm">No page caching plugins detected.</p>
        </div>

        <!-- Known Conflicts -->
        <div v-if="debugData.compatibility?.known_conflicts" class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
          <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
            Known Conflicts
          </h3>
          <div v-if="debugData.compatibility.known_conflicts.length" class="space-y-3">
            <div
              v-for="conflict in debugData.compatibility.known_conflicts"
              :key="conflict.plugin"
              class="flex items-start gap-3 py-3 border-b border-base-300/30 last:border-b-0"
            >
              <span class="size-2 rounded-full mt-1.5 shrink-0" :class="conflict.mitigated ? 'bg-success' : 'bg-warning'"></span>
              <div>
                <span class="text-sm font-medium text-base-content">{{ conflict.plugin }}</span>
                <p class="text-xs text-base-content/50 mt-0.5">{{ conflict.issue }}</p>
              </div>
              <span class="ml-auto text-xs px-2 py-0.5 rounded-full shrink-0" :class="conflict.mitigated ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'">
                {{ conflict.mitigated ? 'Mitigated' : 'Active' }}
              </span>
            </div>
          </div>
          <p v-else class="text-base-content/40 text-sm">No known conflicts detected.</p>
        </div>

        <!-- Competing Recipe Plugins -->
        <div v-if="debugData.compatibility?.recipe_plugins" class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm mb-6">
          <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
            Other Recipe Plugins
          </h3>
          <div v-if="debugData.compatibility.recipe_plugins.length" class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Plugin</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Detection</th>
                  <th class="text-right py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Records</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rp in debugData.compatibility.recipe_plugins" :key="rp.name" class="border-b border-base-300/30 last:border-b-0">
                  <td class="py-3 px-4 text-sm font-medium text-base-content">{{ rp.name }}</td>
                  <td class="py-3 px-4 text-xs text-base-content/50 font-mono">{{ rp.method }}</td>
                  <td class="py-3 px-4 text-sm text-right font-mono text-base-content/70">{{ rp.count !== null ? rp.count : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-base-content/40 text-sm">No competing recipe plugins detected.</p>
        </div>

        <!-- Client Version Check -->
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
                Client Build Check
              </h3>
              <p class="text-xs text-base-content/40 mt-1">Fetches a live post to verify the client JS version matches the installed plugin.</p>
            </div>
            <button
              class="btn btn-sm btn-outline"
              :class="{ 'btn-disabled': clientCheckLoading }"
              @click="runClientCheck"
              :disabled="clientCheckLoading"
            >
              <span v-if="clientCheckLoading" class="loading loading-spinner loading-xs"></span>
              {{ clientCheckLoading ? 'Checking...' : 'Run Check' }}
            </button>
          </div>

          <div v-if="clientCheckData" class="space-y-1">
            <!-- Mismatch alert -->
            <div v-if="clientCheckData.mismatch" class="alert alert-error mb-4 text-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span class="font-medium">Version mismatch!</span>
                Plugin is <strong>{{ clientCheckData.plugin_version }}</strong> but frontend is loading <strong>{{ clientCheckData.client_version }}</strong>.
                <span v-if="clientCheckData.script_status === 404"> The script returns a <strong>404</strong> — likely a stale cache.</span>
              </div>
            </div>

            <div v-else-if="clientCheckData.script_found && !clientCheckData.mismatch" class="alert alert-success mb-4 text-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Client build matches plugin version <strong>{{ clientCheckData.plugin_version }}</strong>.</span>
            </div>

            <div v-else-if="!clientCheckData.script_found && !clientCheckData.error" class="alert alert-warning mb-4 text-sm">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <span class="font-medium">Client script not found in page HTML.</span>
                <p class="opacity-70 mt-0.5">The page may not contain a Create card, or the card may not be rendering its client bundle (e.g., dev mode, lazy loading, or a caching layer stripping scripts).</p>
              </div>
            </div>

            <div v-else-if="clientCheckData.error" class="alert alert-warning mb-4 text-sm">
              <span>{{ clientCheckData.error }}</span>
            </div>

            <div v-if="clientCheckData.plugin_version" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">Plugin Version</span>
              <span class="text-sm text-base-content font-mono">{{ clientCheckData.plugin_version }}</span>
            </div>
            <div v-if="clientCheckData.client_version" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">Client Version (in HTML)</span>
              <span class="text-sm font-mono" :class="clientCheckData.mismatch ? 'text-error' : 'text-success'">{{ clientCheckData.client_version }}</span>
            </div>
            <div v-if="clientCheckData.post_url" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">Checked URL</span>
              <a :href="clientCheckData.post_url" target="_blank" class="text-sm text-primary hover:underline truncate max-w-xs">{{ clientCheckData.post_url }}</a>
            </div>
            <div v-if="clientCheckData.script_url" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">Script URL</span>
              <span class="text-xs font-mono text-base-content/50 truncate max-w-md">{{ clientCheckData.script_url }}</span>
            </div>
            <div v-if="clientCheckData.script_status" class="flex justify-between py-3 border-b border-base-300/30">
              <span class="text-sm text-base-content/60">Script HTTP Status</span>
              <span class="text-sm font-mono" :class="clientCheckData.script_status === 200 ? 'text-success' : 'text-error'">{{ clientCheckData.script_status }}</span>
            </div>
          </div>

          <p v-else class="text-base-content/40 text-sm py-4">Click "Run Check" to fetch a live page and verify the client build.</p>
        </div>
      </div>

      <!-- Plugins Tab -->
      <div v-show="activeTab === 'plugins'">
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
          <h3 class="text-lg text-base-content mb-4" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
            Installed Plugins
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Plugin</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Version</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Author</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Modified</th>
                  <th class="text-right py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="plugin in sortedPlugins" :key="plugin.path" class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors">
                  <td class="py-3 px-4 text-sm font-medium text-base-content">{{ plugin.name }}</td>
                  <td class="py-3 px-4 text-sm text-base-content/70 font-mono">{{ plugin.version }}</td>
                  <td class="py-3 px-4 text-sm text-base-content/70">{{ plugin.author }}</td>
                  <td class="py-3 px-4 text-sm text-base-content/50">{{ formatDate(plugin.modified) }}</td>
                  <td class="py-3 px-4 text-right">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="plugin.active ? 'bg-success/10 text-success' : 'bg-base-200 text-base-content/50'"
                    >
                      {{ plugin.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div v-show="activeTab === 'settings'">
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
              Create Settings
            </h3>
            <input
              v-model="settingsFilter"
              type="text"
              placeholder="Filter settings..."
              class="input input-sm input-bordered max-w-xs"
            />
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-base-300/50">
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Slug</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Value</th>
                  <th class="text-left py-3 px-4 text-xs font-medium text-base-content/50 uppercase tracking-wider">Group</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="setting in filteredSettings" :key="setting.slug" class="border-b border-base-300/30 last:border-b-0 hover:bg-base-50 transition-colors">
                  <td class="py-3 px-4 text-xs font-mono text-base-content">{{ setting.slug }}</td>
                  <td class="py-3 px-4 text-sm text-base-content/70 max-w-xs truncate">{{ displaySettingValue(setting.value) }}</td>
                  <td class="py-3 px-4 text-xs text-base-content/50">{{ setting.group || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <p v-if="filteredSettings.length === 0" class="text-base-content/50 text-center py-8 text-sm">
              No settings match your filter.
            </p>
          </div>
        </div>
      </div>

      <!-- Logs Tab -->
      <div v-show="activeTab === 'logs'">
        <div class="bg-base-100 rounded-xl border border-base-300/50 p-6 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 class="text-lg text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400;">
              Debug Log
            </h3>
            <div class="flex items-center gap-3">
              <select v-model="logLineCount" class="select select-sm select-bordered">
                <option :value="200">200 lines</option>
                <option :value="500">500 lines</option>
                <option :value="1000">1000 lines</option>
                <option :value="2000">2000 lines</option>
                <option :value="5000">5000 lines</option>
              </select>
              <input
                v-model="logSearch"
                type="text"
                placeholder="Search logs..."
                class="input input-sm input-bordered max-w-xs"
                @keydown.enter="fetchLogs"
              />
              <button class="btn btn-sm btn-ghost" @click="fetchLogs" :disabled="logsLoading">
                <svg :class="{ 'animate-spin': logsLoading }" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <div class="dropdown dropdown-end">
                <label tabindex="0" class="btn btn-sm btn-ghost">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </label>
                <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-64 border border-base-300">
                  <li>
                    <button @click="downloadCurrentResults" :disabled="!logsData?.lines?.length">
                      <div class="flex flex-col items-start">
                        <span class="font-medium text-sm">Current results</span>
                        <span class="text-xs text-base-content/50">{{ logsData?.lines?.length || 0 }} lines currently displayed</span>
                      </div>
                    </button>
                  </li>
                  <li>
                    <button @click="downloadFullLog" :disabled="downloadingFullLog">
                      <div class="flex flex-col items-start">
                        <span class="font-medium text-sm flex items-center gap-2">
                          Full log file
                          <span v-if="downloadingFullLog" class="loading loading-spinner loading-xs"></span>
                        </span>
                        <span class="text-xs text-base-content/50">
                          {{ logsData?.total_size ? `${formatBytes(logsData.total_size)} on disk` : 'Stream from site' }}
                        </span>
                      </div>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="logsLoading && !logsData" class="flex justify-center py-12">
            <span class="loading loading-spinner loading-lg text-primary"></span>
          </div>

          <!-- No log file -->
          <div v-else-if="logsData && !logsData.exists" class="text-center py-12">
            <p class="text-base-content/60 mb-2">No debug log file found.</p>
            <p class="text-base-content/40 text-sm">
              Enable debugging by adding <code class="bg-base-200 px-2 py-1 rounded text-xs">define('WP_DEBUG', true);</code>
              and <code class="bg-base-200 px-2 py-1 rounded text-xs">define('WP_DEBUG_LOG', true);</code>
              to wp-config.php
            </p>
          </div>

          <!-- Log content -->
          <div v-else-if="logsData?.lines?.length" class="relative">
            <div v-if="logsData.truncated" class="text-warning text-xs mb-2">
              Showing last {{ logsData.lines.length }} of {{ logsData.total_lines }} lines ({{ formatBytes(logsData.total_size) }} total)
            </div>
            <div class="bg-neutral text-neutral-content rounded-lg overflow-auto max-h-[600px] p-4">
              <pre class="text-xs leading-relaxed font-mono whitespace-pre-wrap break-words">{{ logsData.lines.join('\n') }}</pre>
            </div>
          </div>

          <!-- Empty log -->
          <div v-else-if="logsData" class="text-center py-12">
            <p class="text-base-content/60">Debug log is empty.</p>
          </div>

          <!-- Not yet fetched -->
          <div v-else class="text-center py-12">
            <p class="text-base-content/40 text-sm">Click Refresh to fetch log data.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeftIcon,
  ServerIcon,
  PuzzlePieceIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'

definePageMeta({
  layout: 'admin',
})

const router = useRouter()
const route = useRoute()

const siteId = parseInt(route.params.id as string)

// State
const siteName = ref('')
const siteUrl = ref('')
const activeTab = ref('environment')
const loading = ref(false)
const logsLoading = ref(false)
const error = ref('')
const errorDetails = ref('')
const needsUpdate = ref(false)
const settingsFilter = ref('')
const logLineCount = ref(200)
const logSearch = ref('')
const downloadingFullLog = ref(false)
const clientCheckLoading = ref(false)
const clientCheckData = ref<any>(null)

const debugData = ref<any>(null)
const logsData = ref<any>(null)

// Inline StatusDot component
const StatusDot = defineComponent({
  props: {
    ok: { type: Boolean, default: false },
    labelOn: { type: String, default: 'Yes' },
    labelOff: { type: String, default: 'No' },
  },
  setup(props) {
    return () =>
      h('span', { class: 'flex items-center gap-1.5 text-sm font-medium' }, [
        h('span', {
          class: ['size-2 rounded-full', props.ok ? 'bg-success' : 'bg-base-content/20'],
        }),
        h('span', { class: props.ok ? 'text-success' : 'text-base-content/50' }, props.ok ? props.labelOn : props.labelOff),
      ])
  },
})

const navigateBack = () => {
  router.push(`/sites/${siteId}`)
}

// Load site name for the header
const loadSiteInfo = async () => {
  try {
    const response = await $fetch<any>(`/api/admin/sites/${siteId}`)
    siteName.value = response.name || ''
    siteUrl.value = response.url || ''
  } catch {
    // Non-critical, header will fall back to site ID
  }
}

const sortedPlugins = computed(() => {
  if (!debugData.value?.plugins) return []
  return [...debugData.value.plugins].sort((a: any, b: any) => {
    if (a.active !== b.active) return a.active ? -1 : 1
    return (a.name || '').localeCompare(b.name || '')
  })
})

const activePluginCount = computed(() => {
  if (!debugData.value?.plugins) return 0
  return debugData.value.plugins.filter((p: any) => p.active).length
})

const compatIssueCount = computed(() => {
  const compat = debugData.value?.compatibility
  if (!compat) return 0
  let count = 0
  if (compat.known_conflicts?.length) count += compat.known_conflicts.length
  if (compat.recipe_plugins?.length) count += compat.recipe_plugins.length
  // Count system check failures
  if (compat.system_checks) {
    for (const check of Object.values(compat.system_checks) as any[]) {
      if (!check.ok) count++
    }
  }
  return count
})

const tabs = computed(() => [
  { name: 'Environment', id: 'environment', icon: ServerIcon },
  { name: 'Compatibility', id: 'compatibility', icon: ShieldCheckIcon, badge: compatIssueCount.value || undefined, badgeClass: compatIssueCount.value ? 'badge-warning' : 'badge-primary' },
  { name: 'Plugins', id: 'plugins', icon: PuzzlePieceIcon, badge: activePluginCount.value || undefined },
  { name: 'Settings', id: 'settings', icon: Cog6ToothIcon },
  { name: 'Logs', id: 'logs', icon: DocumentTextIcon },
])

const tierClass = computed(() => {
  const tier = debugData.value?.features?.subscription_tier
  if (tier === 'pro') return 'text-success'
  if (tier === 'free-plus') return 'text-info'
  return 'text-base-content/50'
})

const adNetworkClass = computed(() => {
  const network = debugData.value?.compatibility?.ad_network?.network
  if (network === 'mediavine') return 'text-success'
  if (network === 'raptive') return 'text-info'
  return 'text-base-content/50'
})

const versionCards = computed(() => {
  const env = debugData.value?.environment
  if (!env) return []
  return [
    { label: 'Create', value: env.create_version },
    { label: 'WordPress', value: env.wp_version },
    { label: 'PHP', value: env.php_version },
    { label: 'MySQL', value: env.mysql_version },
  ]
})

const serverInfoItems = computed(() => {
  const env = debugData.value?.environment
  if (!env) return []
  return [
    { label: 'Memory Limit', value: env.memory_limit },
    { label: 'Max Execution Time', value: `${env.max_execution_time}s` },
    { label: 'Upload Max Filesize', value: env.upload_max_filesize },
    { label: 'Post Max Size', value: env.post_max_size },
    { label: 'WP Memory Limit', value: env.wp_memory_limit },
    { label: 'WP_DEBUG', value: env.wp_debug ? 'Enabled' : 'Disabled' },
    { label: 'WP_DEBUG_LOG', value: env.wp_debug_log ? 'Enabled' : 'Disabled' },
    { label: 'Multisite', value: env.multisite ? 'Yes' : 'No' },
    { label: 'SSL', value: env.is_ssl ? 'Yes' : 'No' },
    { label: 'Server Software', value: env.server_software },
    { label: 'Site URL', value: env.site_url },
    { label: 'Timezone', value: env.timezone },
  ]
})

const connectionItems = computed(() => {
  const conn = debugData.value?.connection
  if (!conn) return []
  return [
    { label: 'Studio API URL', value: conn.studio_url },
    { label: 'Public Key Cached', value: conn.public_key_cached ? 'Yes' : 'No' },
    { label: 'Pro Edition', value: conn.is_pro ? 'Yes' : 'No', class: conn.is_pro ? 'text-success' : '' },
    { label: 'Subscription Tier', value: conn.subscription_tier || 'free' },
    { label: 'Last Synced', value: conn.subscription_synced_at || 'Never' },
  ]
})

const settingsArray = computed(() => {
  const settings = debugData.value?.settings
  if (!settings) return []
  if (Array.isArray(settings)) return settings
  return Object.values(settings)
})

const filteredSettings = computed(() => {
  const filter = settingsFilter.value.toLowerCase()
  if (!filter) return settingsArray.value
  return settingsArray.value.filter((s: any) =>
    (s.slug || '').toLowerCase().includes(filter) ||
    String(s.value || '').toLowerCase().includes(filter) ||
    (s.group || '').toLowerCase().includes(filter),
  )
})

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const displaySettingValue = (value: any) => {
  if (value === null || value === undefined) return '(empty)'
  if (typeof value === 'object') return JSON.stringify(value)
  const str = String(value)
  return str.length > 100 ? str.substring(0, 100) + '...' : str
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatCheckName = (key: string) => {
  const names: Record<string, string> = {
    permalinks: 'Pretty Permalinks',
    php_mbstring: 'PHP mbstring',
    php_xml: 'PHP XML',
    php_openssl: 'PHP OpenSSL',
    db_version: 'DB Schema Version',
  }
  return names[key] || key
}

const setActiveTab = (tabId: string) => {
  activeTab.value = tabId
  if (tabId === 'logs' && !logsData.value) {
    fetchLogs()
  }
}

const fetchDebugData = async () => {
  loading.value = true
  error.value = ''
  errorDetails.value = ''
  needsUpdate.value = false
  debugData.value = null
  logsData.value = null

  try {
    const response = await $fetch<any>(`/api/admin/sites/${siteId}/debug`, {
      query: { scope: 'all' },
    })

    if (response.success && response.data) {
      debugData.value = response.data

      if (response.data.environment && !response.data.environment.mysql_version) {
        needsUpdate.value = true
      }
    } else {
      error.value = response.error || 'Failed to fetch debug data'
      errorDetails.value = response.details || ''
    }
  } catch (err: any) {
    error.value = err.data?.message || err.data?.error || 'Site is unreachable'
    errorDetails.value = err.data?.details || 'Check that the site is online and the Create plugin is active.'
  } finally {
    loading.value = false
  }
}

const fetchLogs = async () => {
  logsLoading.value = true

  try {
    const response = await $fetch<any>(`/api/admin/sites/${siteId}/debug`, {
      query: {
        scope: 'logs',
        lines: logLineCount.value,
        search: logSearch.value || undefined,
      },
    })

    if (response.success && response.data?.logs) {
      logsData.value = response.data.logs
    }
  } catch (err: any) {
    console.error('Failed to fetch logs:', err)
  } finally {
    logsLoading.value = false
  }
}

const runClientCheck = async () => {
  clientCheckLoading.value = true
  clientCheckData.value = null

  try {
    const response = await $fetch<any>(`/api/admin/sites/${siteId}/debug`, {
      query: { scope: 'client_check' },
    })

    if (response.success && response.data?.client_check) {
      clientCheckData.value = response.data.client_check
    }
  } catch (err: any) {
    clientCheckData.value = { error: err.data?.message || 'Failed to run client check' }
  } finally {
    clientCheckLoading.value = false
  }
}

const downloadCurrentResults = () => {
  if (!logsData.value?.lines?.length) return

  const content = logsData.value.lines.join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-log-site-${siteId}-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const downloadFullLog = async () => {
  downloadingFullLog.value = true

  try {
    const response = await fetch(`/api/admin/sites/${siteId}/debug?scope=log_download`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('Failed to download full log:', response.status, errorText)
      return
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-log-full-site-${siteId}-${new Date().toISOString().slice(0, 10)}.log`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    console.error('Failed to download full log:', err)
  } finally {
    downloadingFullLog.value = false
  }
}

const downloadDebugInfo = () => {
  if (!debugData.value) return

  const info: Record<string, any> = {
    site: { id: siteId, name: siteName.value, url: siteUrl.value },
    exported_at: new Date().toISOString(),
  }

  if (debugData.value.environment) info.environment = debugData.value.environment
  if (debugData.value.plugins) info.plugins = debugData.value.plugins
  if (debugData.value.theme) info.theme = debugData.value.theme
  if (debugData.value.connection) info.connection = debugData.value.connection
  if (debugData.value.compatibility) info.compatibility = debugData.value.compatibility
  if (debugData.value.features) info.features = debugData.value.features
  if (debugData.value.settings) info.settings = settingsArray.value

  const content = JSON.stringify(info, null, 2)
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `debug-info-site-${siteId}-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadSiteInfo()
  fetchDebugData()
})
</script>
