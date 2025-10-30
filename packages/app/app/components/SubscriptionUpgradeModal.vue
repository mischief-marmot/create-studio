<template>
  <!-- Upgrade Modal -->
  <dialog :class="{ 'modal modal-open': modelValue }" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="mb-2 text-2xl font-bold">Create Unlocked</h3>
      <p class="opacity-70 mb-6 text-sm">Your ads, your way</p>

      <!-- Benefits -->
      <div class="mb-6 space-y-4">
        <p class="text-base">
          Use your own ad network in Interactive Mode and boost your revenue while keeping the amazing reader experience.
        </p>

        <ul class="space-y-3">
          <li class="gap-x-3 flex">
            <svg class="text-success flex-none w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Interactive Mode renders directly on your page—no iframe needed</span>
          </li>
          <li class="gap-x-3 flex">
            <svg class="text-success flex-none w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your ad network runs throughout the entire experience</span>
          </li>
          <li class="gap-x-3 flex">
            <svg class="text-success flex-none w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Readers still get the same great hands-free cooking features</span>
          </li>
          <li class="gap-x-3 flex">
            <svg class="text-success flex-none w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>You earn more from engaged readers spending extra time on your site</span>
          </li>
        </ul>
      </div>

      <div class="divider"></div>

      <!-- Pricing Options -->
      <div class="space-y-4">
        <h4 class="text-lg font-semibold">Choose Your Plan</h4>

        <div class="space-y-3">
          <label
            v-for="plan in pricingPlans"
            :key="plan.id"
            class="flex items-center gap-4 p-4 transition-all border-2 rounded-lg cursor-pointer"
            :class="selectedPriceId === plan.priceId ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'"
          >
            <input
              type="radio"
              name="pricing-plan"
              v-model="selectedPriceId"
              :value="plan.priceId"
              :checked="selectedPriceId === plan.priceId"
              class="radio inset-ring-[1.5px] inset-ring-primary text-primary"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{{ plan.name }}</span>
                <!-- badge-accent badge-success -->
                <div v-if="plan.savings" class="tooltip ">
                  <div class="tooltip-content max-w-50">
                    {{ plan.savingsTooltip }}
                  </div>
                  <span :class="`badge badge-${plan.accentColor} badge-md`">Save {{ plan.savings }}</span>
                </div>
              </div>
              <div class="opacity-70 text-sm">{{ plan.description }}</div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold">${{ plan.price }}</div>
              <div class="opacity-70 text-xs">per {{ plan.period }}</div>
            </div>
          </label>
        </div>
      </div>

      <div v-if="error" class="alert alert-error mt-4">
        <span>{{ error }}</span>
      </div>

      <div class="modal-action">
        <button class="btn" @click="close">Cancel</button>
        <button
          class="btn btn-primary"
          @click="handleUpgrade"
          :disabled="upgrading || !selectedPriceId"
        >
          <span v-if="upgrading" class="loading loading-spinner"></span>
          {{ upgrading ? 'Processing...' : 'Continue to Checkout' }}
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
