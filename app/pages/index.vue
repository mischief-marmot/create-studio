<template>
  <div class="min-h-screen ">
    <!-- Navigation Bar -->
    <nav class="navbar bg-base-100 shadow-lg sticky top-0 z-50 px-2 sm:px-4">
      <div class="navbar-start">
        <div class="dropdown">
          <div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabindex="0" class="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#about">About</a></li>
          </ul>
        </div>
        <a href="/">
          <LogoFull height="32" className="dark:text-base-content" />
        </a>
      </div>
      <div class="navbar-center hidden lg:flex">
        <ul class="menu menu-horizontal px-1">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#about">About</a></li>
        </ul>
      </div>
      <div class="navbar-end">
        <a class="hidden btn btn-primary btn-sm sm:btn-md">Sign In</a>
      </div>
    </nav>

    <!-- Hero Section -->
    <SectionsHero heading="Get rich results for your " :heading-rotate="['Recipes', 'How-Tos', 'Lists']"
      description="Help readers find your content on search. Add automatic JSON-LD schema, free nutrition facts, user ratings, and interactive features—all completely free."
      primary-button-text="Start Free" primary-button-link="https://wordpress.org/plugins/mediavine-create" screenshot-src="/img/screenshots/rich-results.png"
      screenshot-alt="Screenshot showing rich results on Google search from Create cards" />

    <!-- Features Bento Grid -->
    <div id="features" class="bg-base-100 py-6 sm:py-32">
      <div class="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <h2 class="text-base/7 font-semibold text-secondary">Everything you need</h2>
        <p class="mt-2 max-w-lg text-4xl font-semibold tracking-tight text-pretty text-base-content sm:text-5xl">Give
          readers the best content experience</p>
        <div class="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2 text-base-content text-md">
          <!-- Card Types & Schema -->
          <div class="relative lg:col-span-3">
            <div class="absolute inset-0 rounded-box bg-base-200 max-lg:rounded-t-4xl lg:rounded-tl-4xl" />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-box max-lg:rounded-t-[calc(2rem+1px)] lg:rounded-tl-[calc(2rem+1px)]">
              <!-- <div class="h-80 aspect-square sm:aspect-autobg-base-300"></div> -->
              <img class="h-full max-h-80 object-cover object-top-center sm:object-top-left"
                src="/img/screenshots/card-types.png" alt="Multiple card types with automatic schema" />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-secondary">Rich Results</h3>
                <p class="mt-2 text-xl font-medium tracking-tight text-base-content">Show up in search with eye-catching
                  cards</p>
                <p class="mt-2 max-w-lg ">Your readers see beautiful recipe cards, star ratings, and
                  cooking times right in Google search results.</p>
                <p class="mt-1 max-w-lg">
                  <strong>How it works:</strong> We automatically generate
                  proper JSON-LD schema for every card you create.
                </p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-0 rounded-box shadow-sm ring-1 ring-base-300 max-lg:rounded-t-4xl lg:rounded-tl-4xl" />
          </div>

          <!-- Free Nutrition -->
          <div class="relative lg:col-span-3">
            <div class="absolute inset-0 rounded-box bg-base-200 lg:rounded-tr-4xl" />
            <div class="relative flex h-full flex-col overflow-hidden rounded-box lg:rounded-tr-[calc(2rem+1px)]">
              <img class="h-full max-h-80 object-cover object-top-center sm:object-top-left"
                src="/img/screenshots/calculate-nutrition.png" alt="Multiple card types with automatic schema" />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-secondary">Nutrition Facts</h3>
                <p class="mt-2 text-xl font-medium tracking-tight text-base-content">Give readers accurate nutrition
                  info</p>
                <p class="mt-2 max-w-lg">Save hours of manual work while helping health-conscious
                  readers make informed choices.</p>
                  <p class="mt-1 max-w-lg"><strong>How it works:</strong> Our free API calculates nutrition facts
                  automatically from your ingredient list.</p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-0 rounded-box shadow-sm ring-1 ring-base-300 lg:rounded-tr-4xl" />
          </div>

          <!-- Ratings & Reviews -->
          <div class="relative lg:col-span-2">
            <div class="absolute inset-0 rounded-box bg-base-200 lg:rounded-bl-4xl" />
            <div class="relative flex h-full flex-col overflow-hidden rounded-box lg:rounded-bl-[calc(2rem+1px)]">
              <img class="h-full max-h-80 object-cover object-top-center sm:object-top-left"
                src="/img/screenshots/user-ratings.png" alt="Multiple card types with automatic schema" />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-secondary">Social Proof</h3>
                <p class="mt-2 text-xl font-medium tracking-tight text-base-content">Build trust with reader reviews</p>
                <p class="mt-2 max-w-lg">Let your audience share their success stories and help new
                  readers choose what to make. Respond to reviews to build community and keep readers coming back.</p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-0 rounded-box shadow-sm ring-1 ring-base-300 lg:rounded-bl-4xl" />
          </div>

          <!-- Adjustable Servings -->
          <div class="relative lg:col-span-2">
            <div class="absolute inset-0 rounded-box bg-base-200" />
            <div class="relative flex h-full flex-col overflow-hidden rounded-box">
              <img class="h-full max-h-80 object-cover object-top-center sm:object-top-left"
                src="/img/screenshots/adjustable-servings.png" alt="Multiple card types with automatic schema" />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-secondary">Flexibility</h3>
                <p class="mt-2 text-xl font-medium tracking-tight text-base-content">Readers scale recipes to their
                  needs</p>
                <p class="mt-2 max-w-lg">Your readers can cook for 2 or 20 without doing math. All
                  ingredients and nutrition facts adjust automatically when they change the serving size.</p>
              </div>
            </div>
            <div class="pointer-events-none absolute inset-0 rounded-box shadow-sm ring-1 ring-base-300" />
          </div>

          <!-- Recommended Products -->
          <div class="relative lg:col-span-2">
            <div class="absolute inset-0 rounded-box bg-base-200 max-lg:rounded-b-4xl lg:rounded-br-4xl" />
            <div
              class="relative flex h-full flex-col overflow-hidden rounded-box max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-br-[calc(2rem+1px)]">
              <img class="h-full max-h-80 object-cover object-top-center sm:object-top-left"
                src="/img/screenshots/recommended-products.png" alt="Multiple card types with automatic schema" />
              <div class="p-10 pt-4">
                <h3 class="text-sm/4 font-semibold text-secondary">Monetization</h3>
                <p class="mt-2 text-xl font-medium tracking-tight text-base-content">Earn with product recommendations
                </p>
                <p class="mt-2 max-w-lg">Help readers find the tools they need while earning
                  affiliate commissions. Add Amazon links and we'll display them beautifully right in your recipe cards.
                </p>
              </div>
            </div>
            <div
              class="pointer-events-none absolute inset-0 rounded-box shadow-sm ring-1 ring-base-300 max-lg:rounded-b-4xl lg:rounded-br-4xl" />
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Mode Section -->
    <SectionsLargeComplexFeature eyebrow="Transform how readers cook" title="Interactive Mode"
      description="Give your readers an interactive cooking experience that keeps them on your site longer. Swipeable steps, smart timers, and distraction-free design—all free with ad support."
      :demoRecipeUrl="demoRecipeUrl" screenshot="/img/screenshots/interactive-mode.gif"
      screenshot-alt="Interactive mode demonstration" :features="[
        { name: 'Engaging experience', description: `Your readers swipe through steps, interacting with your recipes in an immersive experience&mdash;increasing engagement and reducing frustration`, icon: CodeBracketIcon },
        { name: 'Live ingredient scaling', description: 'Readers adjust servings in-card and ingredients stay updated in Interactive Mode', icon: WindowIcon },
        { name: 'Smart timers', description: 'Create Studio parses your instructions to generate built-in timers to keep readers on-page', icon: BellAlertIcon },
        { name: 'Distraction-free view', description: 'Clean, focused interface keeps readers cooking instead of scrolling past ads and pop-ups, losing their place and getting frustrated', icon: DevicePhoneMobileIcon },
        { name: 'Longer site visits', description: 'Readers stay engaged with your content throughout the entire cooking process', icon: ClockIcon },
        { name: 'Ad supported', description: `You get free access to all of Create's premium features, just from the ads on this feature. Or use your ads for a small fee!'`, icon: CurrencyDollarIcon },
      ]" />

    <!-- How it Works Callout -->
    <div class="bg-accent py-24 sm:py-32 px-6 sm:px-24">
      <div class="flex flex-col space-y-16 py-18 max-w-7xl rounded-xl bg-base-100 overflow-hidden mx-auto text-center font-light">
        <div class="flex flex-col items-center space-y-6">
          <h2 class="text-7xl font-serif">How It Works</h2>
          <p class="text-3xl text-pretty max-w-3xl px-3">
            Interactive Mode is free with our ads—or use your own ads for maximum earnings.
          </p>
        </div>

        <div class="flex flex-col gap-8 xl:px-0 xl:gap-0 xl:flex-row justify-evenly">
          <!-- Free Forever -->
          <div class="px-3 flex-1">
            <div class="hidden xl:inline-flex items-center rounded-full bg-transparent px-4 py-1 text-sm font-semibold text-transparent mb-4" aria-hidden="true">
              Nothing here
            </div>
            <h3 class="text-5xl font-serif mb-4">Free Forever</h3>
            <p class="text-2xl text-pretty mb-6"><em>Ad-supported Interactive Mode</em></p>
            <p class="text-xl text-pretty mb-8 max-w-lg mx-auto">
              Keep 100% of your site's ad revenue while giving readers an amazing experience at zero cost.
            </p>

            <div class="text-left max-w-lg mx-auto space-y-4">
              <h4 class="text-lg font-semibold text-secondary">How it works</h4>
              <ul class="space-y-3">
                <li class="flex gap-x-3">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-base">Your site's ads stay 100% yours—on your pages and in your Create cards</span>
                </li>
                <li class="flex gap-x-3">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-base">When readers click "Interactive Mode," it opens in an iframe with our ads</span>
                </li>
                <li class="flex gap-x-3">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-base">Our ads keep all Create features free while respecting your exclusivity agreements</span>
                </li>
                <li class="flex gap-x-3">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-base">Readers get hands-free cooking, you get premium features—everyone wins</span>
                </li>
              </ul>
            </div>
          </div>
          <!-- Divider -->
          <div class="divider xl:divider-horizontal w-[35%] mx-auto"></div>
          <!-- Create Pro -->
          <div class="px-3 flex-1 relative">
            <div class="inline-flex items-center rounded-full bg-accent px-4 py-1 text-sm font-semibold text-accent-content mb-4">
              Maximize Earnings
            </div>
            <h3 class="text-5xl font-serif mb-4">Create Pro</h3>
            <p class="text-2xl text-pretty mb-6"><em>Your ads, your way</em></p>
            <p class="text-xl text-pretty mb-8 max-w-lg mx-auto">
              Use your own ad network in Interactive Mode and boost your revenue while keeping the amazing reader experience.
            </p>

            <div class="text-left max-w-lg mx-auto space-y-4">
              <h4 class="text-lg font-semibold text-secondary">How it works</h4>
              <ul class="space-y-3">
                <li class="flex gap-x-3">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-base">Interactive Mode renders directly on your page—no iframe needed</span>
                </li>
                <li class="flex gap-x-3">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-base">Your ad network runs throughout the entire experience</span>
                </li>
                <li class="flex gap-x-3">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-base">Readers still get the same great hands-free cooking features</span>
                </li>
                <li class="flex gap-x-3">
                  <CheckCircleIcon class="h-6 w-6 flex-none text-success mt-0.5" />
                  <span class="text-base">You earn more from engaged readers spending extra time on your site</span>
                </li>
              </ul>

              <div class="mt-8 pt-6 border-t border-base-300 text-center">
                <div class="flex items-baseline justify-center gap-x-2 mb-4">
                  <span class="text-4xl font-bold">$8</span>
                  <span class="text-base opacity-70">/month</span>
                </div>
                <a href="#pricing" class="btn btn-accent">Go Pro</a>
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
      <div class="text-center space-y-4">
        <p class="text-base sm:text-lg opacity-85">
          In 2018, Mediavine promised Create would always be free. <strong>I'm honoring that promise.</strong>
        </p>
        <p class="text-base sm:text-lg opacity-70">
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
    <!-- <footer class="footer footer-center p-6 sm:p-8 lg:p-10 bg-base-300 text-base-content overflow-hidden">
      <div class="grid grid-flow-col gap-3 sm:gap-4 text-sm sm:text-base flex-wrap justify-center">
        <a class="link link-hover">About</a>
        <a class="link link-hover">Contact</a>
        <a class="link link-hover">Documentation</a>
        <a class="link link-hover">Privacy Policy</a>
        <a class="link link-hover">Terms of Service</a>
      </div>
      <div>
        <div class="grid grid-flow-col gap-4 sm:gap-6">
          <a class="link">Twitter</a>
          <a class="link">GitHub</a>
          <a class="link">LinkedIn</a>
        </div>
      </div>
      <div>
        <p class="text-sm sm:text-base">
          © 2025 Create Studio. All rights reserved.
        </p>
      </div>
    </footer> -->
  </div>
</template>

<script setup lang="ts">
import { BellAlertIcon, CheckCircleIcon, ClockIcon, CodeBracketIcon, CurrencyDollarIcon, DevicePhoneMobileIcon, ExclamationCircleIcon, WindowIcon } from '@heroicons/vue/20/solid';
const config = useRuntimeConfig().public

// Randomly select a demo recipe on page load
const demoRecipes = [81, 59]
const randomRecipeId = demoRecipes[Math.floor(Math.random() * demoRecipes.length)]
const creationKey = createCreationKey('thesweetestoccasion.com', randomRecipeId)
const demoRecipeUrl = `${config.rootUrl}/creations/${creationKey}/interactive`

// Page meta
definePageMeta({
  name: 'home'
})
</script>
