<template>
  <!-- Upgrade Modal -->
  <dialog :class="{ 'modal-open': modelValue }" class="modal py-6">
    <div class="modal-box bg-base-100 border-base-300 h-full max-w-3xl p-0 overflow-hidden overflow-y-scroll border shadow-2xl">
      <!-- Header Section with Gradient -->
      <div class="bg-gradient-to-br from-base-100 via-base-200 to-base-100 border-base-300 lg:p-8 relative p-4 border-b">
        <!-- Decorative accent -->
        <div class="bg-primary/5 blur-3xl absolute top-0 right-0 w-48 h-48 -mt-24 -mr-24 rounded-full"></div>

        <div class="relative z-10">
          <div class="flex items-start justify-between gap-6">
            <div class="flex-1">
              <div class="inline-flex items-center gap-2 mb-4">
                <div class="bg-primary/15 flex items-center justify-center w-10 h-10 rounded-lg">
                  <svg class="text-primary w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span class="text-primary-content dark:text-primary text-xs font-bold tracking-widest uppercase">Pro Plan</span>
              </div>
              <h2 class="text-base-content mb-3 font-serif text-4xl font-light leading-tight">
                Unlock Full Control
              </h2>
              <p class="text-base-content/70 max-w-lg text-lg font-light">
                Maximize revenue with your own ad network in Interactive Mode while maintaining a superior reader experience.
              </p>
            </div>
            <button
              @click="close"
              class="hover:bg-base-300/50 flex-shrink-0 p-2 transition-colors duration-200 rounded-lg"
              aria-label="Close"
            >
              <svg class="text-base-content/60 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="p-4 space-y-10">
        <!-- Benefits Grid -->
        <div>
          <h3 class="text-base-content/70 mb-5 text-xs font-bold tracking-widest uppercase">Key Benefits</h3>
          <div class="sm:grid-cols-2 grid grid-cols-1 gap-4">
            <div v-for="benefit in benefits" :key="benefit.id" class="bg-base-200/40 border-base-300 rounded-2xl hover:border-success/40 hover:bg-base-200/60 p-5 transition-all duration-200 border">
              <div class="flex gap-3">
                <div class="flex-shrink-0">
                  <div class="bg-success/15 flex items-center justify-center w-8 h-8 rounded-lg">
                    <svg class="text-success w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h4 class="text-base-content text-sm font-semibold">{{ benefit.title }}</h4>
                  <p class="text-base-content/60 mt-1 text-sm">{{ benefit.description }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pricing Section -->
        <div>
          <h3 class="text-base-content/70 mb-5 text-xs font-bold tracking-widest uppercase">Choose Your Billing Period</h3>

          <div class="space-y-3">
            <label
              v-for="plan in pricingPlans"
              :key="plan.id"
              class="group rounded-2xl relative flex items-center gap-4 p-5 transition-all duration-200 border-2 cursor-pointer"
              :class="selectedPriceId === plan.priceId
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-base-300 hover:border-primary/50 hover:bg-base-200/30'"
            >
              <input
                type="radio"
                name="pricing-plan"
                v-model="selectedPriceId"
                :value="plan.priceId"
                :checked="selectedPriceId === plan.priceId"
                class="radio radio-primary flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <div class="sm:flex-row sm:items-center sm:justify-between flex flex-col gap-2">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-base-content font-semibold">{{ plan.name }}</span>
                      <transition name="fade">
                        <span v-if="plan.savings" class="badge badge-lg badge-success">
                          Save {{ plan.savings }}
                        </span>
                      </transition>
                    </div>
                    <p class="text-base-content/60 text-sm">{{ plan.description }}</p>
                  </div>
                  <div class="flex flex-col items-end">
                    <span class="text-base-content text-2xl font-bold">${{ plan.price }}</span>
                    <span class="text-base-content/60 text-xs">per {{ plan.period }}</span>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Error Message -->
        <transition name="slide-down">
          <div v-if="error" class="rounded-2xl bg-error/10 border-error/30 text-error flex items-start gap-3 p-4 border">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span class="text-sm font-medium">{{ error }}</span>
          </div>
        </transition>

        <!-- Trust/Security Note -->
        <div class="bg-base-200/30 border-base-300 rounded-2xl p-5 border">
          <p class="text-base-content/60 flex items-center gap-2 text-sm">
            <svg class="text-success flex-shrink-0 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414L10 3.586l4.707 4.707a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
            Secure payments powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="border-base-300 bg-base-200/50 flex items-center justify-between gap-3 px-10 py-6 border-t">
        <button
          @click="close"
          class="rounded-xl hover:bg-base-300 text-base-content px-6 py-3 font-semibold transition-all duration-200"
        >
          Maybe Later
        </button>
        <button
          @click="handleUpgrade"
          :disabled="upgrading || !selectedPriceId"
          class="btn btn-primary btn-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <transition name="fade" mode="out-in">
            <svg v-if="upgrading" key="loading" class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span v-else key="text">{{ upgrading ? 'Processing...' : 'Continue to Checkout' }}</span>
          </transition>
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click="close">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSiteContext } from '~/composables/useSiteContext'
import { useAuthFetch } from '~/composables/useAuthFetch'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { selectedSiteId } = useSiteContext()
const config = useRuntimeConfig()

const selectedPriceId = ref<string | null>(null)
const upgrading = ref(false)
const error = ref('')

// Benefits list
const benefits = [
  {
    id: 1,
    title: 'Direct Page Rendering',
    description: 'Interactive Mode renders directly on your page—no iframe needed'
  },
  {
    id: 2,
    title: 'Full Ad Network Control',
    description: 'Your ad network runs throughout the entire experience'
  },
  {
    id: 3,
    title: 'Superior Reader Experience',
    description: 'Readers get the same great hands-free cooking features'
  },
  {
    id: 4,
    title: 'Increased Revenue',
    description: 'Earn more from engaged readers spending extra time on your site'
  }
]

// Pricing plans with actual prices and annual savings
const pricingPlans = computed(() => {
  const prices = {
    monthly: 15,
    quarterly: 40,
    annual: 150,
    biennial: 275
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
      accentColor: '',
    },
    {
      id: 'quarterly',
      name: 'Quarterly',
      description: 'Billed every 3 months',
      price: prices.quarterly,
      period: 'quarter',
      priceId: config.public.stripePrice.quarterly,
      savings: `$${quarterlySavings}`,
      savingsTooltip: `Saves $${quarterlySavings} per year compared to monthly billing`,
      accentColor: 'success',
    },
    {
      id: 'annual',
      name: 'Annual',
      description: 'Billed yearly',
      price: prices.annual,
      period: 'year',
      priceId: config.public.stripePrice.annual,
      savings: `$${annualSavings}`,
      savingsTooltip: `Saves $${annualSavings} per year compared to monthly billing`,
      accentColor: 'success',
    },
    {
      id: 'biennial',
      name: 'Biennial',
      description: 'Billed every 2 years',
      price: prices.biennial,
      period: '2 years',
      priceId: config.public.stripePrice.biennial,
      savings: `$${biennialSavings}`,
      savingsTooltip: `Saves $${biennialSavings} over 2 years compared to monthly billing`,
      accentColor: 'accent',
    }
  ]
})

onMounted(async () => {
  // Set default to biennial plan
  const defaultPlan = pricingPlans.value.find((plan) => plan.id === 'annual')
  const priceId = defaultPlan?.priceId || config.public.stripePrice.biennial
  selectedPriceId.value = priceId

  // Wait for DOM to update, then manually check the radio input
  await nextTick()

  const radioInput = document.querySelector(`input[value="${priceId}"]`) as HTMLInputElement
  if (radioInput) {
    radioInput.checked = true
  }
})

const close = () => {
  emit('update:modelValue', false)
  error.value = ''
}

const handleUpgrade = async () => {
  if (!selectedPriceId.value) {
    error.value = 'Please select a billing period'
    return
  }

  upgrading.value = true
  error.value = ''

  try {
    const response = await useAuthFetch('/api/v2/subscriptions/create-checkout-session', {
      method: 'POST',
      body: {
        siteId: selectedSiteId.value,
        priceId: selectedPriceId.value
      }
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
</script>

<style scoped>
/* Fade transition for savings badge and spinner */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide down transition for error message */
.slide-down-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-leave-active {
  transition: all 0.2s ease-in;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
