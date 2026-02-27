import { eq } from 'drizzle-orm'
import { useAdminDb, subscriptions } from '~~/server/utils/admin-db'
import Stripe from 'stripe'
import { getAdminStripeClient } from '~~/server/utils/stripe'

/**
 * GET /api/admin/subscriptions/[id]/revenue
 * Fetches revenue data for a subscription from Stripe
 *
 * Returns:
 * - Plan details (name, amount, interval)
 * - Total revenue (sum of all paid invoices)
 * - Invoice history with PDF links
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const db = useAdminDb(event)
  const subscriptionId = parseInt(event.context.params?.id || '0')

  if (!subscriptionId || isNaN(subscriptionId)) {
    throw createError({ statusCode: 400, message: 'Invalid subscription ID' })
  }

  try {
    const result = await db
      .select({
        stripe_customer_id: subscriptions.stripe_customer_id,
        stripe_subscription_id: subscriptions.stripe_subscription_id,
        tier: subscriptions.tier,
        status: subscriptions.status,
      })
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1)

    if (result.length === 0) {
      throw createError({ statusCode: 404, message: 'Subscription not found' })
    }

    const sub = result[0]

    // No Stripe data — return empty revenue for manual subscriptions
    if (!sub.stripe_subscription_id || !sub.stripe_customer_id) {
      return {
        hasStripe: false,
        plan: null,
        totalRevenue: 0,
        currency: 'usd',
        invoices: [],
      }
    }

    const stripe = getAdminStripeClient()

    // Fetch subscription details (plan/price info)
    const stripeSubscription = await stripe.subscriptions.retrieve(
      sub.stripe_subscription_id,
      { expand: ['items.data.price.product'] }
    )

    const priceItem = stripeSubscription.items.data[0]
    let plan = null
    if (priceItem) {
      const price = priceItem.price
      const product = typeof price.product === 'string' ? null : price.product as Stripe.Product

      plan = {
        name: product?.name || 'Create Pro',
        amount: price.unit_amount ? price.unit_amount / 100 : 0,
        currency: price.currency,
        interval: price.recurring?.interval || 'month',
        intervalCount: price.recurring?.interval_count || 1,
      }
    }

    // Fetch all paid invoices for this customer's subscription
    const allInvoices: Array<{
      id: string
      number: string | null
      date: string | null
      amount: number
      currency: string
      status: string | null
      pdfUrl: string | null
      hostedUrl: string | null
    }> = []
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const params: Stripe.InvoiceListParams = {
        customer: sub.stripe_customer_id,
        subscription: sub.stripe_subscription_id,
        status: 'paid',
        limit: 100,
      }
      if (startingAfter) {
        params.starting_after = startingAfter
      }

      const page = await stripe.invoices.list(params)

      for (const inv of page.data) {
        allInvoices.push({
          id: inv.id,
          number: inv.number,
          date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
          amount: inv.amount_paid ? inv.amount_paid / 100 : 0,
          currency: inv.currency,
          status: inv.status,
          pdfUrl: inv.invoice_pdf,
          hostedUrl: inv.hosted_invoice_url,
        })
      }

      hasMore = page.has_more
      if (page.data.length > 0) {
        startingAfter = page.data[page.data.length - 1].id
      } else {
        hasMore = false
      }
    }

    const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.amount, 0)
    const currency = plan?.currency || allInvoices[0]?.currency || 'usd'

    return {
      hasStripe: true,
      plan,
      totalRevenue,
      currency,
      invoices: allInvoices,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error fetching subscription revenue:', error)
    throw createError({ statusCode: 500, message: 'Failed to fetch revenue data' })
  }
})
