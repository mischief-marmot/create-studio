<template>
  <div class=" min-h-screen">
    <!-- Navigation Bar -->
    <nav 
    :class="[
      scrollPosition > 64 ? 'sm:bg-transparent ' : '',
      'navbar sticky bg-base-100 top-0 text-base-content sm:pt-6 z-50 sm:px-8',
      'transition-colors duration-0'
    ]"
    >
      <div class="navbar-start">
        <div class="dropdown">
          <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabindex="0" class="menu menu-lg dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
          </ul>
        </div>
        <a href="/"
        :class="[
          scrollPosition > 64 ? 'hidden' : ''
        ]"
        >
          <LogoFull height="32" className="dark:text-base-content" />
        </a>
      </div>
      <div class="navbar-center lg:flex hidden px-6"
        :class="[
          scrollPosition > 64 ? 'bg-base-100 text-base-content ring-1 ring-base-content rounded-full' : ''
        ]">
        <ul class="menu menu-horizontal text-md">
          <li><a class="px-6 rounded-full" href="#features">Features</a></li>
          <li><a class="px-6 rounded-full" href="#interactive-mode">Interactive Mode</a></li>
          <li><a class="px-6 rounded-full" href="#how-it-works">Free Forever</a></li>
        </ul>
      </div>
      <div class="navbar-end">
        <a 
        href="/auth/login"
        class="btn btn-primary btn-sm sm:btn-md rounded-full"
        :class="[
          scrollPosition > 64 ? 'hidden' : ''
        ]">Sign In</a>
      </div>
    </nav>

    <!-- Hero Section -->
    <LandingHero />

    <!-- Features Bento Grid -->
    <div id="features" class="bg-base-100 sm:py-24 py-6">
      <div class="lg:max-w-7xl lg:px-8 max-w-2xl px-6 mx-auto">
        <h2 class="text-base/7 text-secondary font-semibold">Everything you need</h2>
        <p class="sm:max-w-lg text-pretty text-base-content mt-2 font-serif text-5xl font-semibold tracking-tight">Give
          readers the best content experience</p>
        <div class="sm:mt-16 lg:grid-cols-6 lg:grid-rows-2 text-base-content text-md grid grid-cols-1 gap-4 mt-10">
          <!-- Card Types & Schema -->
          <div class="lg:col-span-3 relative">
            <div class="rounded-box bg-base-200 max-lg:rounded-t-4xl lg:rounded-tl-4xl absolute inset-0" />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-box max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]">
              <!-- <div class="h-80 aspect-square sm:aspect-autobg-base-300"></div> -->
              <img class="max-h-80 object-top-center sm:object-top-left object-cover h-full"
                src="/img/screenshots/card-types.png" alt="Multiple card types with automatic schema" />
              <div class="sm:p-10 p-4 pt-4">
                <h3 class="text-sm/4 text-secondary font-semibold">Rich Results</h3>
                <p class="text-base-content mt-2 text-xl font-medium tracking-tight">Show up in search with eye-catching
                  cards</p>
                <p class=" max-w-lg mt-2">Your readers see beautiful recipe cards, star ratings, and
                  cooking times right in Google search results.</p>
                <p class="max-w-lg mt-2">
                  <strong>How it works:</strong> We automatically generate
                  proper JSON-LD schema for every card you create.
                </p>
              </div>
            </div>
            <div
              class="rounded-box ring-1 ring-base-300 max-lg:rounded-t-4xl lg:rounded-tl-4xl absolute inset-0 shadow-sm pointer-events-none" />
          </div>

          <!-- Free Nutrition -->
          <div class="lg:col-span-3 relative">
            <div class="rounded-box bg-base-200 lg:rounded-tr-4xl absolute inset-0" />
            <div class="relative flex h-full flex-col overflow-hidden rounded-box lg:rounded-tr-[calc(2rem+1px)]">
              <img class="max-h-80 object-top-center sm:object-top-left object-cover h-full"
                src="/img/screenshots/calculate-nutrition.png" alt="Multiple card types with automatic schema" />
              <div class="sm:p-10 p-4 pt-4">
                <h3 class="text-sm/4 text-secondary font-semibold">Nutrition Facts</h3>
                <p class="text-base-content mt-2 text-xl font-medium tracking-tight">Give readers accurate nutrition
                  info</p>
                <p class="max-w-lg mt-2">Save hours of manual work while helping health-conscious
                  readers make informed choices.</p>
                  <p class="max-w-lg mt-2"><strong>How it works:</strong> Our <i><u>free</u></i> API calculates nutrition facts
                  automatically from your ingredient list.</p>
              </div>
            </div>
            <div
              class="rounded-box ring-1 ring-base-300 lg:rounded-tr-4xl absolute inset-0 shadow-sm pointer-events-none" />
          </div>

          <!-- Ratings & Reviews -->
          <div class="lg:col-span-2 relative">
            <div class="rounded-box bg-base-200 lg:rounded-bl-4xl absolute inset-0" />
            <div class="relative flex h-full flex-col overflow-hidden rounded-box lg:rounded-bl-[calc(2rem+1px)]">
              <img class="max-h-80 object-top-center sm:object-top-left object-cover h-full"
                src="/img/screenshots/user-ratings.png" alt="Multiple card types with automatic schema" />
              <div class="sm:p-10 p-4 pt-4">
                <h3 class="text-sm/4 text-secondary font-semibold">Social Proof</h3>
                <p class="text-base-content mt-2 text-xl font-medium tracking-tight">Build trust with reader reviews</p>
                <p class="max-w-lg mt-2">Let your audience share their stories and help others choose what to make. Respond to reviews to build community and keep readers coming back.
                  </p>
              </div>
            </div>
            <div
              class="rounded-box ring-1 ring-base-300 lg:rounded-bl-4xl absolute inset-0 shadow-sm pointer-events-none" />
          </div>

          <!-- Adjustable Servings -->
          <div class="lg:col-span-2 relative">
            <div class="rounded-box bg-base-200 absolute inset-0" />
            <div class="rounded-box relative flex flex-col h-full overflow-hidden">
              <img class="max-h-80 object-top-center sm:object-top-left object-cover h-full"
                src="/img/screenshots/adjustable-servings.png" alt="Multiple card types with automatic schema" />
              <div class="sm:p-10 p-4 pt-4">
                <h3 class="text-sm/4 text-secondary font-semibold">Servings Adjustments <span class="badge badge-secondary badge-sm ml-1">New!</span></h3>
                <p class="text-base-content mt-2 text-xl font-medium tracking-tight">Readers scale recipes to their
                  needs</p>
                <p class="max-w-lg pb-6 mt-2">Your readers can double or triple ingredients without doing math. All
                  ingredients adjust automatically when they change the serving size.</p>
              </div>
            </div>
            <div class="rounded-box ring-1 ring-base-300 absolute inset-0 shadow-sm pointer-events-none" />
          </div>

          <!-- Recommended Products -->
          <div class="lg:col-span-2 relative">
            <div class="rounded-box bg-base-200 max-lg:rounded-b-4xl lg:rounded-br-4xl absolute inset-0" />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-box max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]">
              <img class="max-h-80 object-top-center sm:object-top-left object-cover h-full"
                src="/img/screenshots/recommended-products.png" alt="Multiple card types with automatic schema" />
              <div class="sm:p-10 p-4 pt-4">
                <h3 class="text-sm/4 text-secondary font-semibold">Affiliate Monetization</h3>
                <p class="text-base-content mt-2 text-xl font-medium tracking-tight">Earn with Recommended Products
                </p>
                <p class="max-w-lg mt-2">Help readers find the tools they need while earning
                  affiliate commissions. Add links from anywhere and we'll display them natively and beautifully, right in your cards.
                </p>
              </div>
            </div>
            <div
              class="rounded-box ring-1 ring-base-300 max-lg:rounded-b-4xl lg:rounded-br-4xl absolute inset-0 shadow-sm pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Mode Section -->
    <LandingInteractiveMode eyebrow="Transforming on-page guides" title="Brand New Interactive Mode"
      description="Give your readers a never-before-seen interactive experience that keeps them on your site longer. Swipeable steps, smart timers, and distraction-free design—all free with ad support."
      :demoRecipeUrl="demoRecipeUrl" screenshot="/img/screenshots/interactive-mode.gif"
      screenshot-alt="Interactive mode demonstration"  />

    <!-- How it Works Callout -->
    <div id="how-it-works" class="bg-primary dark:bg-deep-navy sm:py-32 sm:px-24 px-6 py-24">
      <div class="py-18 max-w-7xl rounded-xl bg-base-100 flex flex-col mx-auto space-y-16 overflow-hidden font-light text-center">
        <div class="flex flex-col items-center space-y-6">
          <h2 class="text-7xl font-serif">How It Works</h2>
          <p class="text-pretty max-w-3xl px-3 text-4xl">
            Create is free with our ads in Interactive Mode&mdash;or use your own ads to maximize earnings.
          </p>

          <!-- Toggle for mobile/tablet -->
          <div class="xl:hidden flex items-center gap-4 mt-8">
            <span :class="['text-lg font-medium transition-opacity', activeTab === 'standard' ? 'opacity-100' : 'opacity-50']">Standard</span>
            <input
              type="checkbox"
              class="toggle toggle-accent"
              v-model="activeTab"
              true-value="unlocked"
              false-value="standard"
            />
            <span :class="['text-lg font-medium transition-opacity', activeTab === 'unlocked' ? 'opacity-100' : 'opacity-50']">Unlocked</span>
          </div>
        </div>

        <div class="xl:flex xl:flex-row xl:justify-evenly xl:gap-0">
          <!-- Free Forever -->
          <div class="flex-1 px-3" :class="{ 'hidden xl:block': activeTab === 'unlocked' }">
            <div class="xl:inline-flex items-center hidden px-4 py-1 mb-4 text-sm font-semibold text-transparent bg-transparent rounded-full" aria-hidden="true">
              Nothing here
            </div>
            <h3 class="mb-4 font-serif text-6xl">Free Forever</h3>
            <p class="text-pretty mb-6 text-2xl"><em>Ad-supported Interactive Mode</em></p>
            <p class="text-pretty max-w-lg mx-auto mb-8 text-xl">
              Keep 100% of your site's ad revenue while giving readers an amazing experience at zero cost.
            </p>

            <div class="max-w-lg mx-auto space-y-4 text-left">
              <h4 class="text-secondary text-lg font-semibold">How it works</h4>
              <ul class="space-y-1">
                <li class="gap-x-3 flex">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-lg">Your site's ads stay 100% yours—on your pages and in your Create cards</span>
                </li>
                <li class="gap-x-3 flex">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-lg">When readers click "Interactive Mode," it opens in an iframe with our ads</span>
                </li>
                <li class="gap-x-3 flex">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-lg">Our ads keep all Create features free while respecting your exclusivity agreements</span>
                </li>
                <li class="gap-x-3 flex">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-lg">Readers get hands-free cooking, you get premium features—everyone wins</span>
                </li>
              </ul>
            </div>
          </div>
          <!-- Divider -->
          <div class="divider xl:divider-horizontal w-[35%] mx-auto hidden"></div>
          <!-- Create Unlocked -->
          <div class="relative flex-1 px-3" :class="{ 'hidden xl:block': activeTab === 'standard' }">
            <div class="xl:inline-flex bg-accent text-accent-content items-center hidden px-4 py-1 mb-4 text-sm font-semibold rounded-full">
              Maximize Earnings
            </div>
            <h3 class="mb-4 font-serif text-6xl">Create Unlocked</h3>
            <p class="text-pretty mb-6 text-2xl"><em>Your ads, your way</em></p>
            <p class="text-pretty max-w-lg mx-auto mb-8 text-xl">
              Use your own ad network in Interactive Mode and boost your revenue while keeping the amazing reader experience.
            </p>

            <div class="max-w-lg mx-auto space-y-4 text-left">
              <h4 class="text-secondary text-lg font-semibold">How it works</h4>
              <ul class="space-y-1">
                <li class="gap-x-3 flex">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-lg">Interactive Mode renders directly on your page—no iframe needed</span>
                </li>
                <li class="gap-x-3 flex">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-lg">Your ad network runs throughout the entire experience</span>
                </li>
                <li class="gap-x-3 flex">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-lg">Readers still get the same great hands-free cooking features</span>
                </li>
                <li class="gap-x-3 flex">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-lg">You earn more from engaged readers spending extra time on your site</span>
                </li>
              </ul>

              <div class="pt-6 mt-8 text-center">
                <div class="gap-x-2 flex items-baseline justify-center mb-4">
                  <span class="text-4xl font-bold">$15</span>
                  <span class="opacity-70 text-base">/month</span>
                </div>
                <a href="#pricing" class="btn btn-accent">Unlock Now</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Section -->
    <!-- <SectionsPricing id="pricing" title="Everything Free. Forever." plan-name="Complete Access"
      plan-description="Every feature. No limits. No credit card. No catch." price-label="Always free" price="$0"
      button-text="Start Free" button-link="#" :features="[
        'Create unlimited cards',
        'All card types (recipes, how-tos, lists)',
        'Automatic rich results for Google',
        'Free nutrition calculations',
        'Reader ratings & reviews',
        'Adjustable servings & scaling',
        'Interactive Mode with ad support',
        'WordPress plugin'
      ]">
      <div class="space-y-4 text-center">
        <p class="sm:text-lg opacity-85 text-base">
          In 2018, Mediavine promised Create would always be free. <strong>I'm honoring that promise.</strong>
        </p>
        <p class="sm:text-lg opacity-70 text-base">
          Want to use your own ads in Interactive Mode? Go Pro for just $8/month to maximize your earnings.
        </p>
      </div>
    </SectionsPricing> -->

    <!-- Cloud-Assisted Plugin Section -->
    <!-- <SectionsComplexFeature id="about" eyebrow="Works with WordPress" title="Your Site, Supercharged"
      description="Add Create to your WordPress site in minutes. Your readers get all the interactive features while your site stays fast and never needs updates."
      screenshot="/img/screenshots/cloud-plugin.png" screenshot-alt="Cloud-assisted plugin integration" :features="[
        { name: 'Drop-in and forget', description: 'Install once with a simple shortcode—no configuration, no maintenance, no updates to manage' },
        { name: 'Always current', description: 'New features appear automatically for your readers without you lifting a finger' },
        { name: 'Lightning fast', description: 'All processing happens in the cloud, so your site loads quickly and stays responsive' },
        { name: 'Future-proof', description: 'We\'re constantly adding new card types and features to help you create better content' }
      ]" /> -->

    <!-- Footer -->
    <!-- <footer class="footer footer-center sm:p-8 lg:p-10 bg-base-300 text-base-content p-6 overflow-hidden">
      <div class="sm:gap-4 sm:text-base grid flex-wrap justify-center grid-flow-col gap-3 text-sm">
        <a class="link link-hover">About</a>
        <a class="link link-hover">Contact</a>
        <a class="link link-hover">Documentation</a>
        <a class="link link-hover">Privacy Policy</a>
        <a class="link link-hover">Terms of Service</a>
      </div>
      <div>
        <div class="sm:gap-6 grid grid-flow-col gap-4">
          <a class="link">Twitter</a>
          <a class="link">GitHub</a>
          <a class="link">LinkedIn</a>
        </div>
      </div>
      <div>
        <p class="sm:text-base text-sm">
          © 2025 Create Studio. All rights reserved.
        </p>
      </div>
    </footer> -->
  </div>
</template>

<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/20/solid';
import { createCreationKey } from '@create-studio/shared';

const config = useRuntimeConfig().public

const scrollPosition = ref(0)

onMounted(() => {
  scrollPosition.value = window.scrollY

  const handleScroll = () => {
    scrollPosition.value = window.scrollY
  }
  window.addEventListener('scroll', handleScroll)
})

// Randomly select a demo recipe on page load
const demoRecipes = [81, 59]
const randomRecipeId = demoRecipes[Math.floor(Math.random() * demoRecipes.length)]
const creationKey = createCreationKey('thesweetestoccasion.com', randomRecipeId)
const demoRecipeUrl = `${config.rootUrl}/creations/${creationKey}/interactive`

// Tab toggle state for mobile/tablet
const activeTab = ref('standard')

// Page meta
definePageMeta({
  name: 'home'
})
</script>
