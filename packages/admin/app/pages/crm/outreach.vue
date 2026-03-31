<template>
  <div class="min-h-screen">
    <div class="px-6 py-8 max-w-[1400px] mx-auto">
      <!-- Page Header -->
      <div class="mb-8">
        <div class="flex items-center gap-2 text-xs font-medium tracking-widest uppercase mb-2">
          <span class="text-base-content/50">CRM</span>
          <span class="text-base-content/30">&middot;</span>
          <span class="text-base-content/40">Contact Management</span>
        </div>
        <h1 class="text-4xl text-base-content" style="font-family: 'Instrument Serif', serif; font-weight: 400; letter-spacing: -0.02em; line-height: 1.1;">
          Outreach
        </h1>
      </div>

      <!-- Sub Navigation -->
      <div class="flex gap-1 mb-6">
        <NuxtLink to="/crm/leads" class="btn btn-sm btn-ghost">Leads</NuxtLink>
        <NuxtLink to="/crm/outreach" class="btn btn-sm btn-primary">Outreach</NuxtLink>
        <NuxtLink to="/crm/pipeline" class="btn btn-sm btn-ghost">Pipeline</NuxtLink>
      </div>

      <!-- Coming Soon -->
      <div class="bg-base-100 rounded-xl border border-base-300/50 shadow-sm">
        <div class="flex flex-col items-center justify-center py-20 text-center px-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h3 class="text-xl text-base-content mb-2" style="font-family: 'Instrument Serif', serif;">Outreach Coming Soon</h3>
          <p class="text-sm text-base-content/50 max-w-md">
            Once the pipeline has enriched publisher profiles and discovered contacts, you'll be able to manage outreach campaigns, track email history, and monitor engagement stages here.
          </p>
          <div class="flex gap-3 mt-6">
            <div class="text-center px-4">
              <div class="text-xs text-base-content/40 uppercase tracking-wider">Stage Pipeline</div>
              <div class="flex items-center gap-1 mt-2 text-xs text-base-content/50">
                <span class="badge badge-xs badge-primary">Queued</span>
                <span>&rarr;</span>
                <span class="badge badge-xs badge-info badge-outline">Contacted</span>
                <span>&rarr;</span>
                <span class="badge badge-xs badge-warning badge-outline">Responded</span>
                <span>&rarr;</span>
                <span class="badge badge-xs badge-success badge-outline">Engaged</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
</script>
