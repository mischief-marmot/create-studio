/**
 * Runtime Config Validation Plugin
 *
 * This plugin runs at server startup and validates that all required
 * environment variables are present and non-empty. If critical config
 * is missing, it will prevent the server from starting, ensuring that
 * deployments fail fast rather than running in a broken state.
 */

import { useLogger } from "@create-studio/shared/utils/logger"

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const logger = useLogger('ValidateConfig', true)

  const errors: string[] = []
  const warnings: string[] = []
  let validationFailed = false

  try {
    // Validate required public config
    const requiredPublicConfig = [
      { key: 'stripePublishableKey', path: 'public.stripePublishableKey' },
      { key: 'stripeBillingPortalUrl', path: 'public.stripeBillingPortalUrl' },
      { key: 'companyName', path: 'public.companyName' },
      { key: 'productName', path: 'public.productName' },
      { key: 'rootUrl', path: 'public.rootUrl' },
      { key: 'supportEmail', path: 'public.supportEmail' },
    ]

    // Validate stripe prices
    const requiredStripePrices = [
      { key: 'monthly', path: 'public.stripePrice.monthly' },
      { key: 'quarterly', path: 'public.stripePrice.quarterly' },
      { key: 'annual', path: 'public.stripePrice.annual' },
      { key: 'biennial', path: 'public.stripePrice.biennial' },
    ]

    // Validate required private config (server-only)
    const requiredPrivateConfig = [
      { key: 'stripeSecretKey', path: 'stripeSecretKey' },
      { key: 'stripeWebhookSecret', path: 'stripeWebhookSecret' },
      { key: 'nixId', path: 'nixId' },
      { key: 'nixKey', path: 'nixKey' },
      { key: 'servicesApiJwtSecret', path: 'servicesApiJwtSecret' },
      { key: 'postmarkKey', path: 'postmarkKey' },
    ]

    // Check public config
    requiredPublicConfig.forEach(({ key, path }) => {
      const value = config.public[key as keyof typeof config.public]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`Missing required config: ${path}`)
      }
    })

    // Check stripe prices
    if (config.public.stripePrice) {
      requiredStripePrices.forEach(({ key, path }) => {
        const value = config.public.stripePrice[key as keyof typeof config.public.stripePrice]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`Missing required config: ${path}`)
        }
      })
    } else {
      errors.push('Missing required config: public.stripePrice')
    }

    // Check private config
    requiredPrivateConfig.forEach(({ key, path }) => {
      const value = config[key as keyof typeof config]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`Missing required config: \x1b[45m\x1b[30m ${path} \x1b[0m`)
      }
    })

    // Check if validation failed
    if (errors.length > 0) {
      validationFailed = true

      const errorMessage = errors.reduce((acc, error) => {
        return `\n${acc}- ${error}\n`
      }, '')

      logger.fatal(`Runtime Config Validation Failed\n\nThe following required configuration values are missing:${errorMessage}\n\nPlease set the required environment variables before deploying.\nCheck your .env file or deployment environment variables.
      `)

      // Throw error to be caught
      throw new Error('Runtime configuration validation failed. Server startup aborted.')
    }

  } catch (error) {
    // Log the error if it's not our validation error
    if (!validationFailed) {
      logger.error('Unexpected error during config validation:', error)
    }

    // Send SIGTERM to the current process
    // This should trigger Nitro's graceful shutdown handlers
    process.kill(process.pid, 'SIGTERM')
  } finally {
    // Log warnings and success messages
    if (!validationFailed) {
      if (warnings.length > 0) {
        logger.warn('Runtime Config Warnings:')
        warnings.forEach(warning => {
          logger.warn(`  - ${warning}`)
        })
        logger.warn('These are optional but recommended for production.')
      }
    }
  }
})