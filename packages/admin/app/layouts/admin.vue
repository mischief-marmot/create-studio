<template>
  <div class="min-h-screen bg-base-100">
    <!-- Placeholder layout - will be fully implemented in task #5 -->
    <aside class="fixed inset-y-0 left-0 w-64 bg-base-200 border-r border-base-300 hidden lg:flex lg:flex-col">
      <div class="p-6 border-b border-base-300">
        <h1 class="font-bold text-lg text-base-content">CS Admin</h1>
      </div>
      <nav class="flex-1 p-4">
        <ul class="space-y-1">
          <li>
            <NuxtLink to="/" class="block px-4 py-2 rounded-lg text-base-content hover:bg-base-300">
              Dashboard
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/users" class="block px-4 py-2 rounded-lg text-base-content hover:bg-base-300">
              Users
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/subscriptions" class="block px-4 py-2 rounded-lg text-base-content hover:bg-base-300">
              Subscriptions
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/sites" class="block px-4 py-2 rounded-lg text-base-content hover:bg-base-300">
              Sites
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/audit-logs" class="block px-4 py-2 rounded-lg text-base-content hover:bg-base-300">
              Audit Logs
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </aside>

    <main class="lg:ml-64">
      <slot />
    </main>
  </div>
</template>
