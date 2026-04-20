import { describe, it, expect } from 'vitest'
import { aprilSurveyDefinition, aprilSurveyPromotion } from '../../server/db/seeds/april-2026-survey'

/**
 * Survey Feature — Unit Tests
 *
 * Tests:
 * - SurveyJS JSON definition structure and completeness
 * - Question type mappings from original spec
 * - Conditional visibility logic
 * - Promotion/discount configuration
 */

// ── Survey definition structure tests ────────────────────────────────────────

describe('April 2026 Survey Definition', () => {
  it('should have title and description', () => {
    expect(aprilSurveyDefinition.title).toBe('Create Publisher Survey')
    expect(aprilSurveyDefinition.description).toContain('5-10 minute')
  })

  it('should have a progress bar configured', () => {
    expect(aprilSurveyDefinition.showProgressBar).toBe('top')
  })

  it('should have 10 pages (blocks)', () => {
    expect(aprilSurveyDefinition.pages).toHaveLength(10)
  })

  it('should have named pages matching blocks', () => {
    const pageNames = aprilSurveyDefinition.pages.map(p => p.name)
    expect(pageNames).toContain('nps')
    expect(pageNames).toContain('about_you')
    expect(pageNames).toContain('state_of_industry')
    expect(pageNames).toContain('positioning')
    expect(pageNames).toContain('tools_and_spend')
    expect(pageNames).toContain('create_specifically')
    expect(pageNames).toContain('bigger_bets')
    expect(pageNames).toContain('ai')
    expect(pageNames).toContain('services')
    expect(pageNames).toContain('final')
  })
})

// ── Question type mapping tests ──────────────────────────────────────────────

describe('Question Type Mappings', () => {
  const allElements = aprilSurveyDefinition.pages.flatMap(p => p.elements)

  function findQuestion(name: string) {
    return allElements.find(e => e.name === name)
  }

  it('should map NPS score to rating type with 0-10 scale', () => {
    const q = findQuestion('nps_score')
    expect(q).toBeDefined()
    expect(q!.type).toBe('rating')
    expect(q!.rateMin).toBe(0)
    expect(q!.rateMax).toBe(10)
    expect(q!.isRequired).toBe(true)
  })

  it('should map long_text to comment type', () => {
    const q = findQuestion('nps_reason')
    expect(q).toBeDefined()
    expect(q!.type).toBe('comment')
    expect(q!.isRequired).toBe(false)
  })

  it('should map single_select to radiogroup', () => {
    const q = findQuestion('site_type')
    expect(q).toBeDefined()
    expect(q!.type).toBe('radiogroup')
    expect(q!.choices).toBeDefined()
    expect(q!.choices!.length).toBeGreaterThan(0)
  })

  it('should map multi_select to checkbox', () => {
    const q = findQuestion('current_paid_tools')
    expect(q).toBeDefined()
    expect(q!.type).toBe('checkbox')
    expect(q!.choices!.length).toBeGreaterThan(5)
  })

  it('should map agree_scale to rating with 1-5 and agree/disagree labels', () => {
    const q = findQuestion('agree_engagement_matters_more')
    expect(q).toBeDefined()
    expect(q!.type).toBe('rating')
    expect(q!.rateMin).toBe(1)
    expect(q!.rateMax).toBe(5)
    expect(q!.minRateDescription).toBe('Strongly disagree')
    expect(q!.maxRateDescription).toBe('Strongly agree')
  })

  it('should map rank to ranking type', () => {
    const q = findQuestion('feature_priorities_top_3')
    expect(q).toBeDefined()
    expect(q!.type).toBe('ranking')
    expect(q!.selectToRankEnabled).toBe(true)
    expect(q!.maxSelectedChoices).toBe(3)
  })

  it('should map email to text with inputType email', () => {
    const q = findQuestion('followup_email')
    expect(q).toBeDefined()
    expect(q!.type).toBe('text')
    expect(q!.inputType).toBe('email')
  })
})

// ── Conditional visibility tests ─────────────────────────────────────────────

describe('Conditional Visibility', () => {
  const allElements = aprilSurveyDefinition.pages.flatMap(p => p.elements)

  it('should show followup_email only when followup_call_optin is Yes', () => {
    const q = allElements.find(e => e.name === 'followup_email')
    expect(q).toBeDefined()
    expect(q!.visibleIf).toBe('{followup_call_optin} = "Yes"')
  })
})

// ── Other item / allow_other_text mapping ────────────────────────────────────

describe('Other Item Support', () => {
  const allElements = aprilSurveyDefinition.pages.flatMap(p => p.elements)

  it('should enable showOtherItem for questions with allow_other_text', () => {
    const siteType = allElements.find(e => e.name === 'site_type')
    expect(siteType!.showOtherItem).toBe(true)

    const adNetwork = allElements.find(e => e.name === 'ad_network')
    expect(adNetwork!.showOtherItem).toBe(true)

    const aiTools = allElements.find(e => e.name === 'ai_tools_used')
    expect(aiTools!.showOtherItem).toBe(true)
  })

  it('should NOT have showOtherItem on questions without allow_other_text', () => {
    const tenure = allElements.find(e => e.name === 'tenure')
    expect(tenure!.showOtherItem).toBeUndefined()
  })
})

// ── Required field coverage ──────────────────────────────────────────────────

describe('Required Fields', () => {
  const allElements = aprilSurveyDefinition.pages.flatMap(p => p.elements)

  it('should mark NPS score as required', () => {
    const q = allElements.find(e => e.name === 'nps_score')
    expect(q!.isRequired).toBe(true)
  })

  it('should mark followup_call_optin as required', () => {
    const q = allElements.find(e => e.name === 'followup_call_optin')
    expect(q!.isRequired).toBe(true)
  })

  it('should mark optional questions as not required', () => {
    const optional = ['nps_reason', 'biggest_worry', 'stack_frustration', 'open_feedback', 'followup_email']
    for (const name of optional) {
      const q = allElements.find(e => e.name === name)
      expect(q, `${name} should exist`).toBeDefined()
      expect(q!.isRequired, `${name} should not be required`).toBe(false)
    }
  })
})

// ── Total question count ─────────────────────────────────────────────────────

describe('Question Coverage', () => {
  const allElements = aprilSurveyDefinition.pages.flatMap(p => p.elements)

  it('should have all 39 questions from the current spec', () => {
    expect(allElements).toHaveLength(39)
  })

  it('should have unique question names', () => {
    const names = allElements.map(e => e.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })
})

// ── Promotion configuration ──────────────────────────────────────────────────

describe('Survey Promotion', () => {
  it('should have discount details', () => {
    expect(aprilSurveyPromotion.discount).toBe('50% off first year of Create Pro')
  })

  it('should specify delivery method', () => {
    expect(aprilSurveyPromotion.delivery).toContain('thank-you screen')
  })

  it('should specify window', () => {
    expect(aprilSurveyPromotion.window).toBe('April 2026')
  })
})
