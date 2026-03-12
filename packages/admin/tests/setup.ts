/**
 * Vitest setup file for admin package tests.
 *
 * Patches the _queryFns registry on analytics-queries when the module is mocked,
 * so that getDashboardAnalytics (kept as the real implementation via importOriginal)
 * correctly calls through mocked sub-query functions.
 */

import { beforeEach } from 'vitest'

beforeEach(async () => {
  try {
    // Import the mocked module (will get vi.fn() versions if mocked)
    const mod = await import('../server/utils/analytics-queries')

    // If _queryFns exists, sync it with the current module exports
    if (mod._queryFns) {
      if (mod.getApiUsageMetrics) mod._queryFns.getApiUsageMetrics = mod.getApiUsageMetrics
      if (mod.getInteractiveMetrics) mod._queryFns.getInteractiveMetrics = mod.getInteractiveMetrics
      if (mod.getTimerMetrics) mod._queryFns.getTimerMetrics = mod.getTimerMetrics
      if (mod.getRatingMetrics) mod._queryFns.getRatingMetrics = mod.getRatingMetrics
      if (mod.getCTAMetrics) mod._queryFns.getCTAMetrics = mod.getCTAMetrics
    }
  } catch {
    // Module not available or not mocked — no action needed
  }
})
