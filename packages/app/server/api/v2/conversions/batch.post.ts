/**
 * POST /api/v2/conversions/batch
 *
 * Batch convert recipe ingredient amounts between US Customary and Metric systems.
 * Called by the Create WordPress plugin when a recipe card is viewed and unit
 * conversion is enabled.
 *
 * Request body:
 * {
 *   creation_id: number,
 *   source_system: "us_customary" | "metric",
 *   ingredients: [
 *     { id: number, amount: string, unit: string, max_amount?: string | null }
 *   ]
 * }
 *
 * Response:
 * {
 *   target_system: "metric" | "us_customary",
 *   conversions: [
 *     { id: number, convertible: boolean, amount: string | null, unit: string | null, max_amount: string | null }
 *   ]
 * }
 */

import { verifyJWT } from '~~/server/utils/auth'
import { sendErrorResponse } from '~~/server/utils/errors'
import { convertBatch } from '~~/server/utils/unitConversion'
import type { BatchConversionRequest } from '~~/server/utils/unitConversion'

export default defineEventHandler(async (event) => {
  try {
    await verifyJWT(event)

    const body = await readBody(event) as BatchConversionRequest

    if (!body.ingredients || !Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      setResponseStatus(event, 400)
      return { error: 'ingredients array is required and must not be empty' }
    }

    if (!body.source_system || !['us_customary', 'metric'].includes(body.source_system)) {
      setResponseStatus(event, 400)
      return { error: 'source_system must be "us_customary" or "metric"' }
    }

    const result = await convertBatch(body)

    setResponseStatus(event, 200)
    return result
  } catch (error) {
    return sendErrorResponse(event, error)
  }
})
