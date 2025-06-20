<template>
  <div class="min-h-screen bg-base-200">
    <!-- Navigation -->
    <div class="navbar bg-base-100 shadow-sm">
      <div class="navbar-start">
        <div class="text-xl font-bold">Recipe Cards</div>
      </div>
      <div class="navbar-end">
        <template v-if="user">
          <NuxtLink to="/dashboard" class="btn btn-ghost">Dashboard</NuxtLink>
          <button @click="handleLogout" class="btn btn-outline">Logout</button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="btn btn-ghost">Sign In</NuxtLink>
          <NuxtLink to="/register" class="btn btn-primary">Sign Up</NuxtLink>
        </template>
      </div>
    </div>

    <!-- Hero Section -->
    <div class="hero min-h-[80vh] bg-gradient-to-br from-primary/10 to-secondary/10">
      <div class="hero-content text-center">
        <div class="max-w-4xl">
          <h1 class="text-5xl font-bold mb-6">
            Create Beautiful <span class="text-primary">Recipe Cards</span> with Structured Data
          </h1>
          <p class="text-xl mb-8 text-base-content/80">
            Generate professional recipe cards, how-to guides, and FAQs with automatic JSON-LD markup 
            for better SEO and embeddable interactive components for your website.
          </p>
          <div class="flex gap-4 justify-center">
            <NuxtLink 
              :to="user ? '/dashboard' : '/register'" 
              class="btn btn-primary btn-lg"
            >
              {{ user ? 'Go to Dashboard' : 'Start Creating' }}
            </NuxtLink>
            <button class="btn btn-outline btn-lg" @click="scrollToFeatures">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Section -->
    <div id="features" class="py-20 bg-base-100">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold mb-4">Everything You Need</h2>
          <p class="text-xl text-base-content/70">Powerful features for content creators and publishers</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="card bg-base-200 shadow-xl">
            <div class="card-body text-center">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 class="card-title justify-center">Recipe Cards</h3>
              <p>Create detailed recipe cards with ingredients, instructions, nutrition info, and cooking times.</p>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body text-center">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 class="card-title justify-center">Structured Data</h3>
              <p>Automatic JSON-LD generation for better SEO and rich snippets in search results.</p>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body text-center">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 class="card-title justify-center">Embeddable</h3>
              <p>Generate interactive embeds for your website with customizable themes and functionality.</p>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body text-center">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 class="card-title justify-center">Monetization</h3>
              <p>Integrate affiliate links and sponsored products seamlessly into your content.</p>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body text-center">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 002 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 class="card-title justify-center">Analytics</h3>
              <p>Track performance with detailed analytics on views, engagement, and conversions.</p>
            </div>
          </div>

          <div class="card bg-base-200 shadow-xl">
            <div class="card-body text-center">
              <div class="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3H5a2 2 0 00-2 2v12a4 4 0 004 4h2a2 2 0 002-2V5a2 2 0 00-2-2H7zM17 3h2a2 2 0 012 2v12a4 4 0 01-4 4h-2a2 2 0 01-2-2V5a2 2 0 012-2h2z" />
                </svg>
              </div>
              <h3 class="card-title justify-center">Templates</h3>
              <p>Save time with pre-built templates and reusable components for common recipe types.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="py-20 bg-primary text-primary-content">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl font-bold mb-4">Ready to Get Started?</h2>
        <p class="text-xl mb-8 opacity-90">
          Join thousands of content creators using Recipe Cards to enhance their websites
        </p>
        <NuxtLink 
          :to="user ? '/dashboard' : '/register'" 
          class="btn btn-accent btn-lg"
        >
          {{ user ? 'Go to Dashboard' : 'Create Your Account' }}
        </NuxtLink>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer footer-center p-10 bg-base-200 text-base-content">
      <aside>
        <p class="font-bold">Recipe Card Generator</p>
        <p>Create beautiful, SEO-optimized recipe cards</p>
        <p>Copyright © 2025 - All rights reserved</p>
      </aside>
    </footer>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const router = useRouter()

const handleLogout = async () => {
  await supabase.auth.signOut()
  await router.push('/')
}

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
}
</script>