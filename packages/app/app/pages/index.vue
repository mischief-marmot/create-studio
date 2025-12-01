<template>
  <NuxtLayout name="main" :navLinks="navLinks">
    <!-- Announcement Banner -->
    <div class="bg-primary text-primary-content px-6 py-3 text-center">
      <div class="max-w-7xl flex flex-wrap items-center justify-center gap-3 mx-auto">
        <span class="text-sm font-semibold">Exciting Announcement! Read the latest news about Create</span>
        <a href="/hello" class="btn btn-sm btn-primary-content">
          Read now
          <ArrowRightIcon class="size-4" />
        </a>
      </div>
    </div>

    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-base-100 via-base-100 to-base-200 lg:py-40 lg:px-8 relative px-6 py-32 overflow-hidden">
      <!-- Background Effects -->
      <div class="opacity-40 absolute inset-0">
        <div class="left-1/2 h-1/2 bg-gradient-radial from-primary/20 to-transparent blur-3xl absolute top-0 w-full -translate-x-1/2" />
        <div class="absolute inset-0 bg-[linear-gradient(90deg,transparent_24%,rgba(var(--primary-rgb),.15)_25%,rgba(var(--primary-rgb),.15)_26%,transparent_27%,transparent_74%,rgba(var(--primary-rgb),.15)_75%,rgba(var(--primary-rgb),.15)_76%,transparent_77%,transparent)_0_60px] bg-[length:60px_60px]" />
      </div>

      <div class="max-w-7xl relative mx-auto text-center">
        <!-- Badge -->
        <div class="bg-base-100 border-base-100 text-base-content animate-fade-in inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-medium border rounded-full">
          <div class="size-2 bg-primary animate-pulse rounded-full" />
          Free WordPress Plugin
        </div>

        <!-- Title -->
        <h1 class="sm:text-7xl lg:text-8xl animate-fade-in-up lg:max-w-3xl max-w-xl mx-auto mb-8 font-serif text-6xl font-light tracking-tight" style="animation-delay: 0.1s">
          Transform your <span class="text-primary sm:min-w-[172px] md:min-w-[208px] lg:min-w-[277px] text-left inline-block italic transition-opacity duration-500 glow-primary">{{ rotatingWords[currentWordIndex] }}</span>
          <br />
          into rich results
        </h1>

        <!-- Subtitle -->
        <p class="sm:text-xl text-base-content animate-fade-in-up max-w-2xl mx-auto mb-10 text-lg leading-relaxed" style="animation-delay: 0.2s">
          Help readers discover your recipes, how-tos, and lists on Google. Automatic JSON-LD schema, free nutrition facts, user ratings, and the industry's first <strong>interactive mode</strong>.
        </p>

        <!-- CTA Buttons -->
        <div class="animate-fade-in-up flex flex-wrap items-center justify-center gap-4" style="animation-delay: 0.3s">
          <a href="/plugin" class="btn btn-primary btn-lg rounded-xl gap-2">
            <ArrowDownTrayIcon class="size-5" />
            Install Create Free
          </a>
          <button @click="scrollToSection('features')" class="btn btn-ghost btn-lg border-base-100 hover:bg-base-100 rounded-xl border">
            Explore Features
          </button>
        </div>
      </div>

      <!-- Hero Visual -->
      <div class="animate-fade-in-up relative mx-auto mt-20" style="animation-delay: 0.5s">
        <!-- Mobile Phone View -->
        <div class="md:hidden max-w-sm mx-auto">
          <div class="bg-base-100 rounded-[2.5rem] p-2 shadow-xl ring-1 ring-base-300">
            <!-- Notch -->
            <div class="flex justify-center mb-2">
              <div class="bg-base-content min-w-24 h-6 rounded-full" />
            </div>
            <!-- Screen -->
            <div class="bg-base-200 rounded-[2rem] p-4 min-h-[660px] flex flex-col">
              <div class="text-base-content pl-2 mb-3 text-xs italic">1.8B+ search results</div>
              <!-- Recipe Card -->
              <div class="bg-gradient-to-br from-base-200 to-base-100 dark:border-base-200 rounded-xl flex flex-col gap-4 p-6 mb-4 border border-none">
                <div class="bg-base-100 flex items-center justify-center w-full h-40 overflow-hidden rounded-lg">
                  <img class="size-full object-cover" src="/img/screenshots/chocolate-cake.jpg" alt="" />
                </div>
                <div>
                  <h3 class="font-serif text-lg font-medium">Best Ever Chocolate Cake</h3>
                  <div class="text-base-content flex mb-4 text-sm">
                    Your Site
                  </div>
                  <div class="text-base-content flex items-center gap-2 text-xs">
                    <span>5.0</span>
                    <span class="flex gap-0.5">
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                    </span>
                    <span class="italic">(3.9k)</span>
                  </div>
                  <div class="mt-2 text-xs">45 min</div>
                  <p class="mt-2 text-xs">Cocoa powder, coconut oil, butter</p>
                </div>
              </div>
              <div class="flex-1 space-y-2">
                <div class="bg-base-100 border-base-100 p-3 border rounded-lg">
                  <div class="text-base-content text-xs font-semibold">Best Ever Chocolate Cake Recipe</div>
                  <div class="text-base-content/60 mb-1 text-xs italic">yoursite.com/chocolate-cake</div>
                  <div class="text-base-content flex items-center gap-1 text-xs">
                    <span class="flex gap-0.5">
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                    </span>
                    <span>5.0</span>
                  </div>
                </div>
                <div class="bg-base-100 border-base-100 p-3 border rounded-lg">
                  <div class="text-base-content text-xs font-semibold">How to Make Chocolate Frosting</div>
                  <div class="text-base-content/60 mb-1 text-xs italic">yoursite.com/chocolate-frosting</div>
                  <div class="text-base-content flex items-center gap-1 text-xs">
                    <span class="flex gap-0.5">
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                    </span>
                    <span>4.7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Desktop Browser View -->
        <div class="md:block w-fit hidden max-w-3xl mx-auto">
          <div class="bg-base-100 border-base-content/20 rounded-2xl overflow-hidden border shadow-2xl">
            <!-- Browser Header -->
            <div class="bg-base-200 border-base-300 flex items-center gap-2 px-4 py-3 border-b">
              <div class="flex gap-1.5">
                <div class="size-3 bg-red-500 rounded-full" />
                <div class="size-3 bg-yellow-500 rounded-full" />
                <div class="size-3 bg-green-500 rounded-full" />
              </div>
            </div>

            <!-- Content -->
            <div class="space-between md:flex-row lg:min-w-3xl flex flex-col-reverse gap-8 p-8">
              <!-- Search Results -->
              <div class="grow-1 space-y-2">
                <div class="text-base-content pl-4 mb-2 text-xs italic">1.8B+ search results</div>
                <div class="bg-base-100 border-base-100 p-4 border rounded-lg">
                  <div class="text-base-content text-sm font-semibold">Best Ever Chocolate Cake Recipe</div>
                  <div class="text-base-content/60 mb-2 text-sm italic">yoursite.com/chocolate-cake</div>
                  <div class="text-base-content flex items-center gap-2 text-xs">
                    <span class="flex gap-0.5">
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                    </span>
                    <span>4.9</span>
                    <span>45 min</span>
                    <span>324 cal</span>
                  </div>
                </div>
                <div class="bg-base-100 border-base-100 p-4 border rounded-lg">
                  <div class="text-base-content text-sm font-semibold">How to Make Chocolate Frosting</div>
                  <div class="text-base-content/60 mb-2 text-sm italic">yoursite.com/chocolate-frosting</div>
                  <div class="text-base-content flex items-center gap-2 text-xs">
                    <span class="flex gap-0.5">
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                    </span>
                    <span>4.7</span>
                    <span>7 steps</span>
                  </div>
                </div>
                <div class="bg-base-100 border-base-100 p-4 border rounded-lg">
                  <div class="text-base-content/60 text-sm font-semibold">Mediocre Chocolate Cake</div>
                  <div class="text-base-content/40 mb-2 text-sm italic">someoneelse.com/why-bother</div>
                </div>
              </div>

              <!-- Recipe Card -->
              <div class="bg-gradient-to-br from-base-200 to-base-100 border-base-100 rounded-xl flex flex-col max-w-xs gap-4 p-6 border">
                <div class="bg-base-100 flex items-center justify-center w-56 h-40 overflow-hidden rounded-lg">
                  <img class="size-full object-cover" src="/img/screenshots/chocolate-cake.jpg" alt="" />
                </div>
                <div>
                  <h3 class="font-serif text-lg font-medium">Best Ever Chocolate Cake</h3>
                  <div class="text-base-content flex mb-4 text-sm">
                    Your Site
                  </div>
                  <div class="text-base-content flex items-center gap-2 text-xs">
                    <span>5.0</span>
                    <span class="flex gap-0.5">
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                      <span class="text-primary">★</span>
                    </span>
                    <span class="italic">(3.9k)</span>
                  </div>
                  <div class="mt-2 text-xs">45 min</div>
                  <p class="mt-2 text-xs">Cocoa powder, coconut oil, butter</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Comparison Section -->
    <section id="why-create" class="bg-base-200 lg:py-24 lg:px-8 px-6 py-16">
      <div class="max-w-6xl mx-auto">
        <div class="mb-16 text-center">
          <span class="text-primary-content dark:text-primary text-lg font-semibold tracking-wide uppercase">Why Create?</span>
          <h2 class="lg:text-7xl mt-2 mb-4 font-serif text-6xl">Premium features. Zero cost.</h2>
          <p class="text-base-content text-3xl">See how Create compares to other popular recipe plugins</p>
        </div>

        <!-- Comparison Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-base-300 border-b">
                <th class="text-base-content px-4 py-4 font-semibold text-left">Feature</th>
                <th class="text-base-content px-4 py-4 font-semibold text-center">
                  WP Recipe Maker
                  <div class="text-base-content text-xs font-normal">$49+/year</div>
                </th>
                <th class="text-primary-content bg-primary/80 dark:bg-primary px-4 py-4 font-semibold text-center">
                  Create
                  <div class="text-primary-content text-xs font-normal">Free forever</div>
                </th>
                <th class="text-base-content px-4 py-4 font-semibold text-center">
                  Tasty Recipes
                  <div class="text-base-content text-xs font-normal">$49-299/year</div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-base-300 divide-y">
              <tr v-for="feature in comparisonFeatures" :key="feature.name" class="hover:bg-base-100/50">
                <td class="text-base-content px-4 py-4">{{ feature.name }}</td>
                <td class="px-4 py-4 text-center">
                  <span v-if="feature.wprm === 'check'" class="text-base-content">✓</span>
                  <span v-else class="text-error">{{ feature.wprm }}</span>
                </td>
                <td class="bg-base-100 px-4 py-4 text-center">
                  <span v-if="feature.create === 'check'" class="text-success font-semibold">✓</span>
                  <span v-else class="text-success font-semibold">{{ feature.create }}</span>
                </td>
                <td class="px-4 py-4 text-center">
                  <span v-if="feature.tasty === 'check'" class="text-base-content">✓</span>
                  <span v-else class="text-error">{{ feature.tasty }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="bg-gradient-to-b from-base-200 via-base-100 to-base-100 text-base-content lg:py-24 lg:px-8 px-6 py-16">
      <div class="max-w-7xl mx-auto">
        <div class="mb-16 text-center">
          <span class="text-primary-content dark:text-primary text-lg font-semibold tracking-wide uppercase">Everything you need</span>
          <h2 class="lg:text-7xl mt-2 font-serif text-6xl">The best content experience</h2>
        </div>

        <div class="space-y-16">
          <!-- Feature 1: Rich Results -->
          <div class="lg:grid-cols-2 grid items-center gap-12">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary border border-primary/70 text-sm font-medium text-primary-content mb-6">
                <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Rich Results
              </div>
              <h3 class="mb-4 font-serif text-3xl">Show up in search with eye-catching cards</h3>
              <p class=" mb-6 text-lg">Your readers see beautiful recipe cards, star ratings, and cooking times right in Google search results. Stand out and drive more clicks.</p>
              <div class="bg-base-300 border-base-content/30 p-4 border rounded-lg">
                <p class=" mb-2 text-sm font-semibold">How it works</p>
                <p class=" text-sm">We automatically generate proper <strong class="">JSON-LD schema</strong> for every card you create. One-button validation ensures correct markup.</p>
              </div>
            </div>
            <div class="bg-base-300 border-base-content/30 rounded-xl p-6 border">
              <div class="space-y-3">
                <div class="bg-base-200 border-base-100/50 p-4 border rounded-lg">
                  <div class=" mb-2 text-xs">yourblog.com › recipes</div>
                  <div class="mb-2 text-sm font-semibold">Easy Lemon Bars Recipe</div>
                  <div class=" flex items-center gap-2 text-xs">
                    <span class="text-primary">★★★★★</span>
                    <span>4.9</span>
                    <span>30 min</span>
                    <span>280 cal</span>
                  </div>
                </div>
                <div class="bg-base-200 border-base-100/50 p-4 border rounded-lg">
                  <div class=" mb-1 text-xs">yourblog.com › desserts</div>
                  <div class=" text-sm">Chocolate Brownies</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature 2: Nutrition -->
          <div class="lg:grid-cols-2 lg:grid-flow-dense grid items-center gap-12">
            <div class="bg-base-300 border-base-content/30 rounded-xl p-6 border">
              <div class="space-y-3">
                <div class="mb-4 text-sm font-semibold">Nutrition Facts</div>
                <div class="space-y-2 text-sm">
                  <div class="border-base-content flex items-center justify-between py-2 border-b">
                    <span>Calories</span>
                    <span class="text-primary-content dark:text-primary font-semibold">380</span>
                  </div>
                  <div class="border-base-content flex items-center justify-between py-2 border-b">
                    <span>Protein</span>
                    <span class="text-primary-content dark:text-primary font-semibold">32g</span>
                  </div>
                  <div class="border-base-content flex items-center justify-between py-2 border-b">
                    <span>Carbs</span>
                    <span class="text-primary-content dark:text-primary font-semibold">18g</span>
                  </div>
                  <div class="flex items-center justify-between py-2">
                    <span>Fat</span>
                    <span class="text-primary-content dark:text-primary font-semibold">22g</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary border border-primary/70 text-sm font-medium text-primary-content mb-6">
                <BoltIcon class="size-4" />
                Nutrition Facts
              </div>
              <h3 class="mb-4 font-serif text-3xl">Give readers accurate nutrition info</h3>
              <p class=" mb-6 text-lg">Save hours of manual work while helping health-conscious readers make informed choices.</p>
              <div class="bg-base-300 border-base-content/30 p-4 border rounded-lg">
                <p class=" mb-2 text-sm font-semibold">How it works</p>
                <p class=" text-sm">Our <strong class="">free API</strong> calculates nutrition facts automatically from your ingredient list. Scientifically accurate and ready to go.</p>
              </div>
            </div>
          </div>

          <!-- Feature 3: Ratings -->
          <div class="lg:grid-cols-2 grid items-center gap-12">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary border border-primary/70 text-sm font-medium text-primary-content mb-6">
                <StarIcon class="size-4" />
                Social Proof
              </div>
              <h3 class="mb-4 font-serif text-3xl">Build trust with reader reviews</h3>
              <p class="mb-6 text-lg">Let your audience share their stories and help others choose what to make. Respond to reviews to build community.</p>
              <div class="bg-base-300 border-base-content/30 p-4 border rounded-lg">
                <p class="mb-2 text-sm font-semibold">How it works</p>
                <p class="text-sm">Readers leave ratings and reviews directly on your cards. You can respond and build a community of engaged followers.</p>
              </div>
            </div>
            <div class="bg-base-300 border-base-content/30 rounded-xl p-6 space-y-4 border">
              <div class="border-slate-950 pb-4 border-b">
                <div class="text-primary mb-2 text-sm">★★★★★</div>
                <p class="text-sm">"Made this for my family and they loved it!"</p>
                <p class="mt-2 text-xs">— Sarah M.</p>
              </div>
              <div class="text-primary mb-2 text-sm">★★★★★</div>
              <p class="text-sm">"Perfect weeknight dinner."</p>
            </div>
          </div>

          <!-- Feature 4: Servings -->
          <div class="lg:grid-cols-2 lg:grid-flow-dense grid items-center gap-12">
            <div class="bg-base-300 border-base-content/30 rounded-xl p-6 border">
              <div class="flex items-center justify-center mb-8">
                <button
                  @click="servingsMultiplier = 1"
                  :class="['btn rounded-r-none btn-sm border border-r-0', servingsMultiplier === 1 ? 'btn-primary border-primary-content' : 'btn-ghost border-base-content/50']"
                >
                  1x
                </button>
                <button
                  @click="servingsMultiplier = 2"
                  :class="['btn rounded-none btn-sm border-t', servingsMultiplier === 2 ? 'btn-primary border-primary-content' : 'btn-ghost border-base-content/50']"
                >
                  2x
                </button>
                <button
                  @click="servingsMultiplier = 3"
                  :class="['btn rounded-l-none btn-sm border border-l-0', servingsMultiplier === 3 ? 'btn-primary border-primary-content' : 'btn-ghost border-base-content/50']"
                >
                  3x
                </button>
              </div>
              <div class="space-y-2 text-sm">
                <div class="border-slate-950 flex items-center justify-between py-2 border-b">
                  <span>{{ getScaledAmount('2', 'lbs') }}</span>
                  <span>salmon fillet</span>
                </div>
                <div class="border-slate-950 flex items-center justify-between py-2 border-b">
                  <span>{{ getScaledAmount('0.25', 'cup') }}</span>
                  <span>honey</span>
                </div>
                <div class="flex items-center justify-between py-2">
                  <span>{{ getScaledAmount('3', 'tbsp') }}</span>
                  <span>soy sauce</span>
                </div>
              </div>
            </div>
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary border border-primary/70 text-sm font-medium text-primary-content mb-6">
                <span class="text-xs italic">1x</span>
                Servings Adjustments
              </div>
              <h3 class="mb-4 font-serif text-3xl">Readers scale recipes to their needs</h3>
              <p class="mb-6 text-lg">Your readers can double or triple ingredients without doing math. All ingredients adjust automatically.</p>
              <div class="bg-base-300 border-base-content/30 p-4 border rounded-lg">
                <p class="mb-2 text-sm font-semibold">How it works</p>
                <p class="text-sm">Intelligent scaling adjusts quantities proportionally as readers change servings. Measurements update in real-time.</p>
              </div>
            </div>
          </div>

          <!-- Feature 5: Interactive Mode -->
          <div class="flex flex-col items-center gap-12">
            <div class="max-w-2xl">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary border border-primary/70 text-sm font-medium text-primary-content mb-6">
                <PlayIcon class="size-4" />
                Interactive Mode
              </div>
              <h3 class="mb-4 font-serif text-3xl">The industry's first interactive cooking mode</h3>
              <p class="mb-6 text-lg">Give your readers a hands-free cooking experience with smart timers, step-by-step guidance, and distraction-free design.</p>
              <div class="bg-base-300 border-base-content/30 p-4 border rounded-lg">
                <p class="mb-2 text-sm font-semibold">How it works</p>
                <p class="text-sm">Readers enter Interactive Mode to follow your recipe step-by-step with built-in timers and a clean interface designed for the kitchen.</p>
              </div>
            </div>
            <LandingInteractiveMode
              title="Brand New Interactive Mode"
              description="Readers get a distraction-free experience with built-in timers, step-by-step guidance, and automatic progress saving."
              :demoRecipeUrl="demoRecipeUrl"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="bg-base-100 lg:py-24 lg:px-8 border-base-100 px-6 py-16 border-t">
      <div class="max-w-4xl mx-auto">
        <div class="mb-16 text-center">
          <span class="text-primary text-sm font-semibold tracking-wide uppercase">Simple Pricing</span>
          <h2 class="lg:text-5xl mt-2 font-serif text-4xl">Start free, upgrade when you're ready</h2>
        </div>

        <div class="md:grid-cols-2 grid gap-6">
          <!-- Free Plan -->
          <div class="bg-base-100/50 border-base-300 md:border-none rounded-2xl p-8 border">
            <h3 class="mb-2 font-serif text-2xl">Free Forever</h3>
            <p class="text-base-content mb-6">Ad-supported Interactive Mode</p>
            <div class="mb-8">
              <span class="text-5xl font-bold">$0</span>
              <span class="text-base-content ml-2">forever</span>
            </div>
            <p class="text-base-content mb-8">Keep 100% of your site's ad revenue while giving readers an amazing experience at zero cost.</p>
            <div class="mb-8 space-y-3">
              <p class="text-base-content text-sm font-semibold">How it works</p>
              <ul class="space-y-2">
                <li class="text-base-content flex items-start gap-3 text-sm">
                  <CheckIcon class="size-5 text-primary flex-shrink-0 mt-0.5" />
                  Your site's ads stay 100% yours
                </li>
                <li class="text-base-content flex items-start gap-3 text-sm">
                  <CheckIcon class="size-5 text-primary flex-shrink-0 mt-0.5" />
                  Readers access Interactive Mode with our ads
                </li>
                <li class="text-base-content flex items-start gap-3 text-sm">
                  <CheckIcon class="size-5 text-primary flex-shrink-0 mt-0.5" />
                  All features free forever
                </li>
              </ul>
            </div>
            <a href="/plugin" class="btn btn-ghost btn-block border-base-100 hover:bg-base-100 border">Get Started Free</a>
          </div>

          <!-- Pro Plan -->
          <div class="bg-gradient-to-br from-base-100 to-base-100 border-primary rounded-2xl relative p-8 border">
            <div class="-top-4 right-8 bg-gradient-to-r from-primary to-primary/80 text-primary-content absolute px-4 py-1 text-sm font-bold rounded-lg">
              Maximize Earnings
            </div>
            <h3 class="mb-2 font-serif text-2xl">Create Pro</h3>
            <p class="text-base-content mb-6">Your ads, your way</p>
            <div class="mb-8">
              <span class="text-5xl font-bold">$15</span>
              <span class="text-base-content ml-2">/month</span>
            </div>
            <p class="text-base-content mb-8">Use your own ad network in Interactive Mode and boost your revenue while keeping the amazing reader experience.</p>
            <div class="mb-8 space-y-3">
              <p class="text-sm font-semibold">How it works</p>
              <ul class="space-y-2">
                <li class="text-base-content flex items-start gap-3 text-sm">
                  <CheckIcon class="size-5 text-primary flex-shrink-0 mt-0.5" />
                  Interactive Mode on your page with your ads
                </li>
                <li class="text-base-content flex items-start gap-3 text-sm">
                  <CheckIcon class="size-5 text-primary flex-shrink-0 mt-0.5" />
                  Full control over the experience
                </li>
                <li class="text-base-content flex items-start gap-3 text-sm">
                  <CheckIcon class="size-5 text-primary flex-shrink-0 mt-0.5" />
                  Earn more from engaged readers
                </li>
              </ul>
            </div>
            <a href="#" class="btn btn-primary btn-block rounded-xl">Upgrade Now</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="bg-primary lg:py-24 lg:px-8 px-6 py-16">
      <div class="max-w-2xl mx-auto text-center">
        <h2 class="lg:text-5xl text-primary-content mb-6 font-serif text-4xl">Get Rich Results Today.</h2>
        <p class="text-primary-content/80 mb-10 text-lg">Install Create for free and get the best experience for you and your readers.</p>
        <a href="/plugin" class="btn btn-lg bg-base-100 text-base-content hover:bg-base-200 gap-2">
          Install Create
          <ArrowRightIcon class="size-5" />
        </a>
      </div>
    </section>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import {
  ArrowRightIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  StarIcon,
  BoltIcon,
  PlayIcon,
} from '@heroicons/vue/20/solid'

const config = useRuntimeConfig().public

// Rotating words for hero title
const rotatingWords = ['Recipes', 'How-Tos', 'Lists']
const currentWordIndex = ref(0)

// Rotate through words every 3 seconds
onMounted(() => {
  setInterval(() => {
    currentWordIndex.value = (currentWordIndex.value + 1) % rotatingWords.length
  }, 3000)
})

// Servings multiplier state
const servingsMultiplier = ref(1)

// Helper function to scale ingredient amounts
const getScaledAmount = (baseAmount: string, unit: string) => {
  const base = parseFloat(baseAmount)
  const scaled = base * servingsMultiplier.value

  // Format nicely - if it's a whole number, show without decimals
  const formatted = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2)

  return `${formatted} ${unit}`
}

// Demo recipe URL - hardcoded for now until createCreationKey is available
const demoRecipeUrl = computed(() => {
  const demoRecipes = [44, 59, 55]
  const randomRecipeId = demoRecipes[Math.floor(Math.random() * demoRecipes.length)]
  // Using a base64-encoded format similar to createCreationKey
  const keyString = `thesweetestoccasion.com:${randomRecipeId}`
  const creationKey = btoa(keyString)
  return `${config.rootUrl}/creations/${creationKey}/interactive`
})

// Navigation links
const navLinks = {
  '#why-create': 'Why Create?',
  '#features': 'Features',
  '#interactive-mode': 'Interactive Mode',
  '#pricing': 'Pricing',
}

// Scroll to section
const scrollToSection = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

// Comparison data
const comparisonFeatures = [
  { name: 'JSON-LD Schema', wprm: 'check', create: 'check', tasty: 'check' },
  { name: 'Nutrition API', wprm: 'Paid', create: 'Free', tasty: 'Paid' },
  { name: 'Card Templates', wprm: 'Dated', create: 'Beautiful', tasty: 'Polished' },
  { name: 'Interactive Mode', wprm: '✗', create: 'Exclusive', tasty: '✗' },
  { name: 'Content Types', wprm: 'Recipes', create: 'Recipes, How-Tos, Lists', tasty: 'Recipes' },
  { name: 'User Ratings', wprm: 'Paid', create: 'Free', tasty: 'Paid' },
  { name: 'Serving Adjustments', wprm: 'Paid', create: 'Free', tasty: 'Paid' },
]

// Page meta
definePageMeta({
  name: 'home'
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
  opacity: 0;
}

.animate-fade-in-up {
  animation: fade-in-up 0.8s ease-out forwards;
  opacity: 0;
}

/* Gradient background utility */
.bg-gradient-radial {
  background: radial-gradient(var(--tw-gradient-stops));
}

/* Ensure slate colors work */
@layer components {
  .btn-ghost {
    @apply transition-colors;
  }
}
</style>
