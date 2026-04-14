<template>
  <div class="min-h-screen">
    <!-- Page Header -->
    <header class="backdrop-blur-xl bg-base-100/80 border-base-300/60 sticky top-0 z-10 border-b">
      <div class="lg:px-12 max-w-[1400px] lg:pt-10 p-6 mx-auto">
        <div class="breadcrumbs text-xs">
          <ul>
            <li>
              <NuxtLink to="/admin" class="font-thin">Dashboard</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/settings#subscription" class="font-thin">Site Settings</NuxtLink>
            </li>
            <li class="font-light">Upgrade to Pro</li>
          </ul>
        </div>
        <h1 class="text-base-content lg:text-5xl mb-2 font-serif text-3xl">{{ trialEligible ? 'Try Pro Free' : 'Upgrade to Pro' }}</h1>
        <p class="text-base-content/70">
          <template v-if="trialEligible && selectedSite">14-day free trial for <span class="text-primary italic">{{ selectedSite.name || selectedSite.url }}</span></template>
          <template v-else-if="selectedSite">Upgrading <span class="text-primary italic">{{ selectedSite.name || selectedSite.url }}</span></template>
          <template v-else>Unlock premium features for your site</template>
        </p>
      </div>
    </header>

    <!-- Floating CTA -->
    <transition name="float">
      <div
        v-if="showFloatingCta"
        class="bottom-6 left-1/2 fixed z-50 -translate-x-1/2"
      >
        <button
          @click="scrollToPricing"
          class="btn btn-primary gap-2 px-8 rounded-full shadow-xl"
        >
          {{ trialEligible ? 'Start Free Trial' : 'Upgrade Now' }}
          <ArrowDownIcon class="size-4" />
        </button>
      </div>
    </transition>

    <!-- Main Content -->
    <div class="lg:px-12 max-w-[1400px] px-6 py-10 mx-auto space-y-12">

      <!-- Trial CTA (primary banner for eligible users) -->
      <section v-if="trialEligible" class="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border-primary/20 rounded-2xl flex items-start gap-4 px-6 py-6 border">
        <div class="bg-primary/15 rounded-xl p-2.5 flex-shrink-0 mt-0.5">
          <SparklesIcon class="text-primary size-6" />
        </div>
        <div class="flex-1">
          <p class="text-base-content mb-1 text-base font-semibold">Try Pro free for 14 days</p>
          <p class="text-base-content/60 text-sm leading-relaxed">
            Experience all premium features — Interactive Mode, servings adjustment, unit conversion, checklists, and more — for free.
            <template v-if="sites.length >= 2"> When you upgrade, get <strong class="text-base-content">50% off Pro for your other sites</strong>.</template>
            <template v-else> Run multiple sites? Upgrade and get <strong class="text-base-content">50% off additional sites</strong>.</template>
          </p>
          <button @click="scrollToPricing" class="btn btn-primary btn-sm mt-3 rounded-lg gap-1.5">
            Start Free Trial
            <ArrowDownIcon class="size-3.5" />
          </button>
        </div>
      </section>

      <!-- Multi-site Discount Banner (only shown when not trial-eligible and not trialing) -->
      <section v-else-if="!isTrialing && activePaidCount >= 1" class="bg-success/10 border-success/30 rounded-2xl flex items-center gap-3 px-6 py-5 border">
        <TagIcon class="text-success size-5 flex-shrink-0" />
        <p class="text-base-content text-sm">
          <strong class="text-success">Multi-site discount applied!</strong>
          You're getting 50% off because you already have Pro on another site.
        </p>
      </section>
      <section v-else-if="!isTrialing && activePaidCount === 0 && sites.length >= 2" class="bg-info/10 border-info/30 rounded-2xl flex items-center gap-3 px-6 py-5 border">
        <TagIcon class="text-info size-5 flex-shrink-0" />
        <p class="text-base-content text-sm">
          <strong>Multi-site discount:</strong> Upgrade this site and get 50% off Pro for your other sites.
        </p>
      </section>
      <section v-else-if="!isTrialing && activePaidCount === 0 && sites.length <= 1" class="bg-base-200/50 border-base-300 rounded-2xl flex items-center gap-3 px-6 py-5 border">
        <TagIcon class="text-base-content/50 size-5 flex-shrink-0" />
        <p class="text-base-content/70 text-sm">
          Run multiple WordPress sites? Additional sites get 50% off Pro.
        </p>
      </section>

      <!-- Feature Cards — 2x2 grid -->
      <section class="lg:grid-cols-2 grid grid-cols-1 gap-6">
        <!-- Interactive Mode -->
        <div class="bg-base-100 border-base-300 rounded-3xl lg:p-12 p-8 border-2">
          <h2 class="text-base-content mb-3 font-serif text-2xl font-light">Interactive Mode</h2>
          <p class="text-base-content/70 mb-6 text-sm leading-relaxed">
            A mobile-first, step-by-step cooking experience that renders directly on your page.
            Readers swipe through instructions hands-free with smart timers automatically
            parsed from your recipe steps.
          </p>
          <ul class="space-y-3">
            <li class="flex items-start gap-3">
              <CheckCircleIcon class="text-success size-5 flex-shrink-0 mt-0.5" />
              <span class="text-base-content/80 text-sm"><strong class="text-base-content">Direct page rendering</strong> — no iframe, your ad network runs throughout</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircleIcon class="text-success size-5 flex-shrink-0 mt-0.5" />
              <span class="text-base-content/80 text-sm"><strong class="text-base-content">Smart timers</strong> — detected from text like "bake for 25 minutes"</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircleIcon class="text-success size-5 flex-shrink-0 mt-0.5" />
              <span class="text-base-content/80 text-sm"><strong class="text-base-content">Saved progress</strong> — readers resume where they left off</span>
            </li>
            <li class="flex items-start gap-3">
              <CheckCircleIcon class="text-success size-5 flex-shrink-0 mt-0.5" />
              <span class="text-base-content/80 text-sm"><strong class="text-base-content">Customizable</strong> — control button text and toggle per site</span>
            </li>
          </ul>
        </div>

        <!-- Reader Experience Tools -->
        <div class="bg-base-100 border-base-300 rounded-3xl lg:p-12 p-8 border-2">
          <h3 class="text-base-content mb-3 font-serif text-2xl font-light">Reader Experience Tools</h3>
          <p class="text-base-content/70 mb-6 text-sm leading-relaxed">
            Interactive tools that make your content more useful and keep readers on your site longer.
          </p>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="bg-primary/10 rounded-lg p-1.5 flex-shrink-0 mt-0.5">
                <ScaleIcon class="text-primary size-4" />
              </div>
              <div>
                <p class="text-base-content text-sm font-medium">Adjustable Servings</p>
                <p class="text-base-content/60 text-xs">Readers scale ingredient amounts with one-tap serving multipliers — 1x, 2x, 3x, or any custom amount.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="bg-primary/10 rounded-lg p-1.5 flex-shrink-0 mt-0.5">
                <ArrowsRightLeftIcon class="text-primary size-4" />
              </div>
              <div>
                <p class="text-base-content text-sm font-medium">Unit Conversion</p>
                <p class="text-base-content/60 text-xs">Toggle between US Customary and Metric measurements on any recipe. Your international readers will thank you.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="bg-primary/10 rounded-lg p-1.5 flex-shrink-0 mt-0.5">
                <ClipboardDocumentCheckIcon class="text-primary size-4" />
              </div>
              <div>
                <p class="text-base-content text-sm font-medium">Interactive Checklists</p>
                <p class="text-base-content/60 text-xs">Readers check off ingredients and steps as they cook. Progress persists across page reloads.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Themes & Customization -->
        <div class="bg-base-100 border-base-300 rounded-3xl lg:p-12 p-8 border-2">
          <h3 class="text-base-content mb-3 font-serif text-2xl font-light">Themes & Customization</h3>
          <p class="text-base-content/70 mb-6 text-sm leading-relaxed">
            Make your recipe cards look like they belong on your site with premium themes and full CSS control.
          </p>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="bg-primary/10 rounded-lg p-1.5 flex-shrink-0 mt-0.5">
                <PaintBrushIcon class="text-primary size-4" />
              </div>
              <div>
                <p class="text-base-content text-sm font-medium">Premium Themes</p>
                <p class="text-base-content/60 text-xs">Editorial and Modern Elegant — two distinctive card designs by Mischief Marmot that go beyond the standard styles.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="bg-primary/10 rounded-lg p-1.5 flex-shrink-0 mt-0.5">
                <CodeBracketIcon class="text-primary size-4" />
              </div>
              <div>
                <p class="text-base-content text-sm font-medium">Custom CSS</p>
                <p class="text-base-content/60 text-xs">Add your own CSS to customize card appearance beyond what built-in themes offer. Match your brand exactly.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews & Content -->
        <div class="bg-base-100 border-base-300 rounded-3xl lg:p-12 p-8 border-2">
          <h3 class="text-base-content mb-3 font-serif text-2xl font-light">Reviews & Content Tools</h3>
          <p class="text-base-content/70 mb-6 text-sm leading-relaxed">
            Build social proof and manage your content more efficiently with advanced review and list tools.
          </p>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="bg-primary/10 rounded-lg p-1.5 flex-shrink-0 mt-0.5">
                <ChatBubbleLeftEllipsisIcon class="text-primary size-4" />
              </div>
              <div>
                <p class="text-base-content text-sm font-medium">Review Responses & Management</p>
                <p class="text-base-content/60 text-xs">Respond to reader reviews, edit and bulk manage ratings, and feature your best reviews with a dedicated Gutenberg block.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="bg-primary/10 rounded-lg p-1.5 flex-shrink-0 mt-0.5">
                <StarIcon class="text-primary size-4" />
              </div>
              <div>
                <p class="text-base-content text-sm font-medium">Featured Reviews Block</p>
                <p class="text-base-content/60 text-xs">Showcase your best reviews anywhere on your site. Build trust with new visitors by highlighting real reader feedback.</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="bg-primary/10 rounded-lg p-1.5 flex-shrink-0 mt-0.5">
                <RectangleStackIcon class="text-primary size-4" />
              </div>
              <div>
                <p class="text-base-content text-sm font-medium">Products in Lists & Bulk Import</p>
                <p class="text-base-content/60 text-xs">Add products as list items for native affiliate placements, and paste URLs to bulk import list items instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section ref="pricingSection" id="pricing" class="max-w-2xl mx-auto">
        <div class="bg-base-100 border-base-300 rounded-3xl overflow-hidden border-2">
          <div class="lg:p-12 p-6">

            <!-- Multi-site discount badge -->
            <div v-if="hasMultiSiteDiscount" class="flex justify-center mb-6">
              <span class="inline-flex items-center gap-1.5 bg-success/10 text-success rounded-full px-4 py-1.5 text-sm font-medium">
                <TagIcon class="size-4" />
                Multi-site discount: 50% off
              </span>
            </div>

            <!-- Price display -->
            <div v-if="selectedPlan" class="mb-10 text-center">
              <div v-if="hasMultiSiteDiscount" class="text-base-content/40 mb-1 text-lg line-through">
                ${{ selectedPlan.price }}
              </div>
              <div class="flex items-baseline justify-center gap-1.5">
                <span class="text-base-content/40 font-serif text-2xl font-light">$</span>
                <span class="text-base-content tabular-nums pricing-value font-serif text-6xl font-light">{{ displayPrice }}</span>
                <span class="text-base-content/40 text-base font-light">/ {{ selectedPlan.period }}</span>
              </div>
              <div class="flex items-center justify-center h-6 mt-3">
                <transition name="fade-slide" mode="out-in">
                  <span
                    v-if="selectedPlan.savings"
                    :key="selectedPlan.id + '-savings'"
                    class="inline-flex items-center gap-1.5 text-success bg-success/10 rounded-full px-3 py-1 text-xs font-medium"
                  >
                    Save {{ selectedPlan.savings }} vs. monthly
                  </span>
                  <span
                    v-else
                    :key="selectedPlan.id + '-cancel'"
                    class="text-base-content/40 text-sm"
                  >
                    Cancel anytime
                  </span>
                </transition>
              </div>
            </div>

            <!-- Slider -->
            <div class="px-1 mb-10">
              <input
                type="range"
                min="0"
                :max="pricingPlans.length - 1"
                :value="selectedSliderIndex"
                @input="onSliderInput"
                class="range range-primary w-full"
                :step="1"
              />
              <!-- Tick labels -->
              <div class="flex justify-between mt-3 px-0.5">
                <button
                  v-for="(plan, index) in pricingPlans"
                  :key="plan.id"
                  @click="setSliderIndex(index)"
                  class="group flex flex-col items-center min-w-0 gap-1 transition-all duration-200 cursor-pointer"
                  :class="selectedSliderIndex === index ? 'scale-105' : 'opacity-50 hover:opacity-75'"
                >
                  <span
                    class="text-xs font-medium transition-colors duration-200"
                    :class="selectedSliderIndex === index ? 'text-base-content' : 'text-base-content/60'"
                  >{{ plan.name }}</span>
                  <span
                    v-if="plan.tag"
                    class="text-[10px] font-semibold text-primary leading-none"
                  >{{ plan.tag }}</span>
                </button>
              </div>
            </div>

            <!-- Plan description -->
            <div v-if="selectedPlan" class="mb-8 text-center">
              <p class="text-base-content/50 text-sm">{{ selectedPlan.description }}</p>
            </div>

            <!-- Error Message -->
            <transition name="slide-down">
              <div v-if="error" role="alert" class="alert alert-error mb-6">
                <ExclamationCircleIcon class="size-5 flex-shrink-0" />
                <span class="text-sm font-medium">{{ error }}</span>
              </div>
            </transition>

            <!-- CTA -->
            <div class="flex flex-col items-center gap-3">
              <div v-if="trialEligible" class="grid grid-cols-2 gap-3 w-full">
                <button
                  @click="handleUpgrade(true)"
                  :disabled="upgrading || !selectedPriceId"
                  class="btn btn-primary btn-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span
                    v-if="upgrading === 'trial'"
                    class="border-primary-content/30 border-t-primary-content animate-spin w-5 h-5 border-2 rounded-full"
                  ></span>
                  {{ upgrading === 'trial' ? 'Processing...' : 'Start 14-Day Free Trial' }}
                </button>
                <button
                  @click="handleUpgrade(false)"
                  :disabled="upgrading || !selectedPriceId"
                  class="btn btn-outline btn-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span
                    v-if="upgrading === 'paid'"
                    class="border-base-content/30 border-t-base-content animate-spin w-5 h-5 border-2 rounded-full"
                  ></span>
                  {{ upgrading === 'paid' ? 'Processing...' : 'Upgrade Now' }}
                </button>
              </div>
              <button
                v-else
                @click="handleUpgrade(false)"
                :disabled="upgrading || !selectedPriceId"
                class="btn btn-primary btn-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                <span
                  v-if="upgrading"
                  class="border-primary-content/30 border-t-primary-content animate-spin w-5 h-5 border-2 rounded-full"
                ></span>
                {{ upgrading ? 'Processing...' : 'Continue to Checkout' }}
              </button>

              <p class="text-base-content/40 flex items-center gap-1.5 text-xs">
                <LockClosedIcon class="size-3 flex-shrink-0" />
                {{ trialEligible ? 'Cancel anytime during your trial' : 'Secure checkout via Stripe' }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Back Link -->
      <div class="pb-8 text-center">
        <NuxtLink
          to="/admin/settings#subscription"
          class="text-base-content/60 hover:text-base-content inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeftIcon class="size-4" />
          Back to Site Settings
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  ArrowLeftIcon,
  ArrowDownIcon,
  PaintBrushIcon,
  ScaleIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentCheckIcon,
  CodeBracketIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  RectangleStackIcon,
  TagIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'
import { useSiteContext } from '~/composables/useSiteContext'
import { useAuthFetch } from '~/composables/useAuthFetch'

definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

const route = useRoute()
const { selectedSiteId, selectedSite, sites, loadSites } = useSiteContext()
const config = useRuntimeConfig()

const selectedPriceId = ref<string | null>(null)
const upgrading = ref<false | 'trial' | 'paid'>(false)
const error = ref('')
const activePaidCount = ref(0)
const trialEligible = ref(false)
const isTrialing = ref(false)

// Floating CTA visibility — hide once pricing section is in view
const pricingSection = ref<HTMLElement | null>(null)
const showFloatingCta = ref(true)
let observer: IntersectionObserver | null = null

onMounted(async () => {
  // Handle site_url query parameter (sent from WordPress plugin)
  const siteUrl = route.query.site_url as string | undefined
  if (siteUrl) {
    await loadSites(siteUrl)
  }

  // Fetch subscription status to determine multi-site discount and trial eligibility
  if (selectedSiteId.value) {
    try {
      const status = await useAuthFetch(`/api/v2/subscriptions/status/${selectedSiteId.value}`)
      if (status.success && typeof status.activePaidCount === 'number') {
        activePaidCount.value = status.activePaidCount
      }
      if (status.success && status.is_trialing) {
        isTrialing.value = true
      }
      if (status.success && status.trial_eligible && !status.is_trialing) {
        trialEligible.value = true
      }
    } catch {
      // Non-critical — proceed without discount info
    }
  }

  // Default to annual plan
  const defaultPlan = pricingPlans.value.find((plan) => plan.id === 'annual')
  const priceId = defaultPlan?.priceId || config.public.stripePrice.annual
  selectedPriceId.value = priceId

  // Observe pricing section for floating CTA
  await nextTick()
  if (pricingSection.value) {
    observer = new IntersectionObserver(
      ([entry]) => {
        showFloatingCta.value = !entry.isIntersecting
      },
      { threshold: 0.1 }
    )
    observer.observe(pricingSection.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

const scrollToPricing = () => {
  pricingSection.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const hasMultiSiteDiscount = computed(() => activePaidCount.value >= 1 && !isTrialing.value)

const displayPrice = computed(() => {
  if (!selectedPlan.value) return 0
  if (hasMultiSiteDiscount.value) {
    return Math.round(selectedPlan.value.price * 0.5 * 100) / 100
  }
  return selectedPlan.value.price
})

const selectedPlan = computed(() => {
  return pricingPlans.value.find((plan) => plan.priceId === selectedPriceId.value) || null
})

const selectedSliderIndex = computed(() => {
  const idx = pricingPlans.value.findIndex((plan) => plan.priceId === selectedPriceId.value)
  return idx >= 0 ? idx : 2 // default to annual (index 2)
})

const setSliderIndex = (index: number) => {
  const plan = pricingPlans.value[index]
  if (plan) {
    selectedPriceId.value = plan.priceId
  }
}

const onSliderInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  setSliderIndex(Number(target.value))
}

// Pricing plans
const pricingPlans = computed(() => {
  const prices = {
    monthly: 15,
    quarterly: 40,
    annual: 150,
    biennial: 275,
  }

  const quarterlySavings = Math.round((prices.monthly * 12) - (prices.quarterly * 4))
  const annualSavings = Math.round((prices.monthly * 12) - prices.annual)
  const biennialSavings = Math.round(((prices.monthly * 12) - prices.annual) + ((prices.monthly * 12) - (prices.biennial - prices.annual)))

  return [
    {
      id: 'monthly',
      name: 'Monthly',
      description: 'Billed monthly',
      price: prices.monthly,
      period: 'month',
      priceId: config.public.stripePrice.monthly,
      savings: null,
      tag: null,
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      description: 'Billed every 3 months',
      price: prices.quarterly,
      period: 'quarter',
      priceId: config.public.stripePrice.quarterly,
      savings: `$${quarterlySavings}/yr`,
      tag: null,
    },
    {
      id: 'annual',
      name: 'Annual',
      description: 'Billed yearly',
      price: prices.annual,
      period: 'year',
      priceId: config.public.stripePrice.annual,
      savings: `$${annualSavings}/yr`,
      tag: 'Popular',
    },
    {
      id: 'biennial',
      name: '2 Years',
      description: 'Billed every 2 years',
      price: prices.biennial,
      period: '2 years',
      priceId: config.public.stripePrice.biennial,
      savings: `$${biennialSavings}`,
      tag: 'Best Value',
    },
  ]
})

const handleUpgrade = async (withTrial: boolean) => {
  if (!selectedPriceId.value) {
    error.value = 'Please select a billing period'
    return
  }

  upgrading.value = withTrial ? 'trial' : 'paid'
  error.value = ''

  try {
    const response = await useAuthFetch('/api/v2/subscriptions/create-checkout-session', {
      method: 'POST',
      body: {
        siteId: selectedSiteId.value,
        priceId: selectedPriceId.value,
        ...(withTrial && trialEligible.value ? { trial: true } : {}),
      },
    })

    if (response.success && response.url) {
      window.location.href = response.url
    } else {
      error.value = response.error || 'Failed to create checkout session'
    }
  } catch (err: any) {
    error.value = err.data?.error || 'Failed to create checkout session'
  } finally {
    upgrading.value = false
  }
}

useHead({
  title: 'Upgrade to Pro - Create Studio',
  meta: [
    { name: 'description', content: 'Upgrade to Create Studio Pro for premium themes, interactive mode, and reader engagement tools' },
  ],
})
</script>

<style scoped>
.slide-down-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-leave-active {
  transition: all 0.2s ease-in;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.float-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.float-leave-active {
  transition: all 0.2s ease-in;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.pricing-value {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.float-enter-from {
  opacity: 0;
  transform: translate(-50%, 20px);
}

.float-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px);
}
</style>
