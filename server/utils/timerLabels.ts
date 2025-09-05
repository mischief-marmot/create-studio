interface TimerVocabulary {
  [label: string]: {
    keywords: string[]
    priority: number // Higher priority wins when multiple matches
  }
}

/**
 * Comprehensive vocabulary mapping for timer labels
 * Organized by cooking/recipe activity with priority levels
 */
export const TIMER_VOCABULARY: TimerVocabulary = {
  // === COOKING METHODS (High Priority) ===
  'Bake': {
    keywords: ['bake', 'baking', 'baked', 'oven', 'roast', 'roasting', 'roasted'],
    priority: 10
  },
  'Boil': {
    keywords: ['boil', 'boiling', 'boiled', 'bubbling', 'rolling boil'],
    priority: 10
  },
  'Simmer': {
    keywords: ['simmer', 'simmering', 'simmered', 'gentle boil', 'low heat'],
    priority: 10
  },
  'Fry': {
    keywords: ['fry', 'frying', 'fried', 'pan fry', 'deep fry', 'sauté', 'sautéing', 'sautéed'],
    priority: 10
  },
  'Grill': {
    keywords: ['grill', 'grilling', 'grilled', 'barbecue', 'bbq', 'char'],
    priority: 10
  },
  'Steam': {
    keywords: ['steam', 'steaming', 'steamed', 'steam basket'],
    priority: 10
  },
  'Braise': {
    keywords: ['braise', 'braising', 'braised', 'slow cook'],
    priority: 9
  },
  'Broil': {
    keywords: ['broil', 'broiling', 'broiled', 'broiler'],
    priority: 9
  },

  // === PREPARATION TECHNIQUES (Medium-High Priority) ===
  'Blend': {
    keywords: ['blend', 'blending', 'blended'],
    priority: 9
  },
  'Mix': {
    keywords: ['mix', 'mixing', 'mixed', 'combine', 'combining', 'stir', 'stirring', 'whisk', 'whisking'],
    priority: 8
  },
  'Knead': {
    keywords: ['knead', 'kneading', 'kneaded', 'work dough', 'massage'],
    priority: 9
  },
  'Beat': {
    keywords: ['beat', 'beating', 'beaten', 'whip', 'whipping', 'whipped'],
    priority: 8
  },
  'Cream': {
    keywords: ['cream', 'creaming', 'creamed', 'cream together'],
    priority: 8
  },
  'Fold': {
    keywords: ['fold', 'folding', 'folded', 'fold in', 'gently combine'],
    priority: 8
  },

  // === TEMPERATURE & RESTING (High Priority) ===
  'Cool': {
    keywords: ['cool', 'cooling', 'cooled', 'cool down', 'room temperature'],
    priority: 9
  },
  'Chill': {
    keywords: ['chill', 'chilling', 'chilled', 'refrigerate', 'refrigerating', 'refrigerated', 'fridge'],
    priority: 9
  },
  'Freeze': {
    keywords: ['freeze', 'freezing', 'frozen', 'freezer'],
    priority: 9
  },
  'Rest': {
    keywords: ['rest', 'resting', 'rested', 'sit', 'sitting', 'stand', 'standing', 'let stand'],
    priority: 8
  },
  'Rise': {
    keywords: ['rise', 'rising', 'risen', 'proof', 'proofing', 'proofed', 'double in size'],
    priority: 9
  },

  // === SPECIALIZED TECHNIQUES (Medium Priority) ===
  'Marinate': {
    keywords: ['marinate', 'marinating', 'marinated', 'marinade'],
    priority: 7
  },
  'Steep': {
    keywords: ['steep', 'steeping', 'steeped', 'infuse', 'infusing'],
    priority: 7
  },
  'Bloom': {
    keywords: ['bloom', 'blooming', 'bloomed', 'activate', 'dissolve'],
    priority: 7
  },
  'Reduce': {
    keywords: ['reduce', 'reducing', 'reduced', 'thicken', 'concentrate'],
    priority: 7
  },
  'Caramelize': {
    keywords: ['caramelize', 'caramelizing', 'caramelized', 'golden brown'],
    priority: 7
  },

  // === BAKING SPECIFIC (Medium Priority) ===
  'Preheat': {
    keywords: ['preheat', 'preheating', 'preheated', 'heat oven', 'warm oven'],
    priority: 6
  },
  'Proof': {
    keywords: ['proof', 'proofing', 'proofed', 'activate yeast', 'bloom yeast'],
    priority: 7
  },
  'Set': {
    keywords: ['set', 'setting', 'firm up', 'solidify'],
    priority: 6
  },

  // === GENERIC COOKING (Lower Priority) ===
  'Cook': {
    keywords: ['cook', 'cooking', 'cooked', 'heat', 'heating', 'heated'],
    priority: 5
  },
  'Prepare': {
    keywords: ['prepare', 'preparing', 'prepared', 'prep'],
    priority: 4
  },
  'Process': {
    keywords: ['process', 'processing', 'processed'],
    priority: 4
  },
  'Wait': {
    keywords: ['wait', 'waiting', 'hold', 'pause'],
    priority: 3
  },

  // === DEFAULT FALLBACK ===
  'Timer': {
    keywords: [], // Will be used as fallback
    priority: 1
  }
}

/**
 * Find the best matching timer label for a given text
 * @param text The instruction text to analyze
 * @returns Object with label, icon, and confidence score
 */
export function detectTimerLabel(text: string): {
  label: string
  icon?: string
  confidence: number
} {
  const lowerText = text.toLowerCase()
  
  let bestMatch = {
    label: 'Timer',
    icon: undefined as string | undefined,
    confidence: 0,
    priority: 0
  }

  // Check each vocabulary entry
  for (const [label, config] of Object.entries(TIMER_VOCABULARY)) {
    if (label === 'Timer') continue // Skip fallback for now
    
    let matches = 0
    let totalKeywords = config.keywords.length
    
    // Count keyword matches
    for (const keyword of config.keywords) {
      if (lowerText.includes(keyword)) {
        matches++
        
        // Bonus points for exact word matches (not just substrings)
        const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i')
        if (wordBoundaryRegex.test(text)) {
          matches += 0.5 // Bonus for whole word match
        }
      }
    }
    
    if (matches > 0) {
      // Calculate confidence: (matches/totalKeywords) * priority weight
      const confidence = (matches / totalKeywords) * config.priority
      
      // Best match is determined by confidence, with priority as tiebreaker
      if (confidence > bestMatch.confidence || 
          (confidence === bestMatch.confidence && config.priority > bestMatch.priority)) {
        bestMatch = {
          label,
          icon: undefined,
          confidence,
          priority: config.priority
        }
      }
    }
  }
  
  // If no matches found, use fallback
  if (bestMatch.confidence === 0) {
    bestMatch = {
      label: 'Timer',
      icon: undefined,
      confidence: 0.1, // Low confidence fallback
      priority: 1
    }
  }
  
  return {
    label: bestMatch.label,
    icon: bestMatch.icon,
    confidence: bestMatch.confidence
  }
}

/**
 * Find the best matching timer label using a simple rule:
 * The active verb immediately before and closest to the duration wins
 * @param text The instruction text to analyze
 * @param timeMatchIndex The index position where the duration starts
 * @returns Object with label, icon, and confidence score
 */
export function detectTimerLabelWithProximity(text: string, timeMatchIndex: number): {
  label: string
  icon?: string
  confidence: number
} {
  let bestMatch = {
    label: 'Timer',
    distance: Infinity,
    verbForm: 0 // 0=none, 1=past/passive, 2=active/gerund, 3=imperative
  }

  // Check each vocabulary entry
  for (const [label, config] of Object.entries(TIMER_VOCABULARY)) {
    if (label === 'Timer') continue // Skip fallback
    
    // Check each keyword for this label
    for (const keyword of config.keywords) {
      // Find all occurrences of this keyword
      const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi')
      let match
      
      while ((match = keywordRegex.exec(text)) !== null) {
        const verbIndex = match.index
        
        // Only consider verbs that come BEFORE the duration
        if (verbIndex >= timeMatchIndex) continue
        
        const distance = timeMatchIndex - verbIndex
        
        // Determine verb form weight
        let verbForm = 1 // default: past/passive
        const keywordLower = keyword.toLowerCase()
        
        // Imperative/base form (highest priority) - e.g., "blend", "bake", "mix"
        if (keywordLower === label.toLowerCase() || 
            (!keywordLower.endsWith('ing') && !keywordLower.endsWith('ed'))) {
          verbForm = 3
        }
        // Gerund/active form (high priority) - e.g., "blending", "baking", "mixing"
        else if (keywordLower.endsWith('ing')) {
          verbForm = 2
        }
        // Past/passive form (lower priority) - e.g., "blended", "baked", "mixed"
        else if (keywordLower.endsWith('ed')) {
          verbForm = 1
        }
        
        // Update best match if this is better:
        // 1. Higher verb form wins
        // 2. If same verb form, closer distance wins
        if (verbForm > bestMatch.verbForm || 
            (verbForm === bestMatch.verbForm && distance < bestMatch.distance)) {
          bestMatch = {
            label,
            distance,
            verbForm
          }
        }
      }
    }
  }
  
  return {
    label: bestMatch.label,
    icon: undefined,
    confidence: bestMatch.verbForm > 0 ? 1.0 : 0.1
  }
}

/**
 * Enhanced timer detection that also extracts time duration
 * @param text The instruction text to analyze
 * @returns Complete timer information
 */
export function parseTimerFromText(text: string): {
  duration?: number // in seconds
  label: string
  icon?: string
  confidence: number
  rawTimeText?: string
} | null {
  // Enhanced time pattern matching
  const timePatterns = [
    // Basic patterns: "30 minutes", "1 hour", "2-3 minutes"
    /(\d+)(?:[-–](\d+))?\s*(?:to\s+(\d+)\s*)?(?:minutes?|mins?|min)\b/i,
    /(\d+)(?:[-–](\d+))?\s*(?:to\s+(\d+)\s*)?(?:hours?|hrs?|hr)\b/i,
    /(\d+)(?:[-–](\d+))?\s*(?:to\s+(\d+)\s*)?(?:seconds?|secs?|sec)\b/i,
    
    // Combined patterns: "1 hour 30 minutes", "2h 15m"
    /(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s+)?(\d+)\s*(?:minutes?|mins?|m)\b/i,
    /(\d+)h\s*(\d+)m\b/i 
  ]
  
  let duration: number | undefined
  let rawTimeText: string | undefined
  let timeMatchIndex = -1
  
  for (const pattern of timePatterns) {
    const match = text.match(pattern)
    if (match) {
      rawTimeText = match[0]
      timeMatchIndex = match.index || 0
      
      if (pattern.source.includes('until')) {
        // For "until" patterns, we can't determine exact time
        duration = undefined
        break
      }
      
      // Parse time components
      if (pattern.source.includes('hours?|hrs?|h')) {
        if (pattern.source.includes('minutes?|mins?|m')) {
          // Combined hour + minute pattern
          const hours = parseInt(match[1] || '0')
          const minutes = parseInt(match[2] || '0')
          duration = (hours * 60 + minutes) * 60
        } else {
          // Hour only pattern
          const hours = parseInt(match[1])
          duration = hours * 60 * 60
        }
      } else if (pattern.source.includes('minutes?|mins?|min')) {
        // Minute pattern (may include range)
        const minutes = parseInt(match[1])
        duration = minutes * 60
      } else if (pattern.source.includes('seconds?|secs?|sec')) {
        // Second pattern
        const seconds = parseInt(match[1])
        duration = seconds
      }
      break
    }
  }
  
  // If no time found, return null
  if (!duration && !rawTimeText?.includes('until')) {
    return null
  }
  
  // Get timer label with proximity weighting if we have a time match
  const labelInfo = timeMatchIndex >= 0 
    ? detectTimerLabelWithProximity(text, timeMatchIndex)
    : detectTimerLabel(text)
  
  return {
    duration,
    label: labelInfo.label,
    icon: labelInfo.icon,
    confidence: labelInfo.confidence,
    rawTimeText
  }
}