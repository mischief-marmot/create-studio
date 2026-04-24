import '../widget.css'
import { WidgetSDK } from './lib/widget-sdk'
import { useLogger } from '@create-studio/shared/utils/logger'
import { SharedStorageManager } from '@create-studio/shared/lib/shared-storage/shared-storage-manager'
import { normalizeDomain, createCreationKey } from '@create-studio/shared/utils/domain'

// Function to dynamically load CSS
function loadWidgetCSS() {
  // Check if CSS is already loaded as a stylesheet (not just preloaded)
  if (document.querySelector('link[rel="stylesheet"][href*="entry.css"]')) {
    return
  }

  // Create and inject CSS link
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.type = 'text/css'
  // Get the base URL from the script tag (main.js source) to determine embed URL
  const scriptTag = document.querySelector('script#create-studio-embed') as HTMLScriptElement | null
  if (!scriptTag) return
  const scriptSrc = scriptTag.src
  const baseUrl = new URL(scriptSrc).origin
  // Edge cache is invalidated on each widget deploy via the upload-widget
  // purge_cache call — no per-request cache-busting needed.
  link.href = `${baseUrl}/embed/entry.css`
  document.head.appendChild(link)
}

/**
 * Sync WordPress card ingredient checkboxes with SharedStorageManager.
 * Works for both in-DOM and iframe modes — storage changes broadcast
 * via postMessage are already handled by SharedStorageManager itself.
 */
function syncIngredientChecklists(section: Element, creationKey: string) {
  const ingredientItems = section.querySelectorAll('.mv-create-ingredients li')
  if (!ingredientItems.length) return

  const storageManager = new SharedStorageManager()
  storageManager.setCurrentCreation(creationKey)

  function getKey(li: Element): string {
    const groupEl = li.closest('[data-ingredient-group]')
    const groupIndex = groupEl ? parseInt(groupEl.getAttribute('data-ingredient-group') || '0') : 0
    const ingredientIndex = parseInt(li.getAttribute('data-ingredient-index') || '0')
    return `g${groupIndex}-${ingredientIndex}`
  }

  function applyStateToDOM() {
    storageManager.setCurrentCreation(creationKey)
    ingredientItems.forEach((li) => {
      const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null
      if (!checkbox) return
      const isChecked = storageManager.isSupplyChecked(getKey(li))
      checkbox.checked = isChecked
      // Keep the WordPress plugin's mv-checklist-checked CSS class in sync.
      // Setting checkbox.checked programmatically doesn't fire a change event,
      // so the plugin's own updateIngredientStyle() won't run — we do it here.
      li.classList.toggle('mv-checklist-checked', isChecked)
    })
  }

  // Apply initial state
  applyStateToDOM()

  // Sync card → storage when user checks an ingredient
  ingredientItems.forEach((li) => {
    const checkbox = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null
    if (!checkbox) return
    checkbox.addEventListener('change', () => {
      storageManager.setCurrentCreation(creationKey)
      storageManager.toggleSupply(getKey(li))
      // Notify same-tab interactive mode (in-DOM only) to refresh immediately
      window.dispatchEvent(new CustomEvent('cs:storage-updated'))
    })
  })

  // Sync storage → card when interactive mode (iframe) updates state
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'CREATE_STUDIO_STORAGE_SYNC') {
      setTimeout(applyStateToDOM, 50)
    }
  })
}

declare global {
  interface Window {
    CreateStudio: any
  }
}

// Utility to get URL parameters
function getUrlParam(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get(name)
}

// Utility to find the current script tag
function getCurrentScript(): HTMLScriptElement | null {
  const scripts = document.getElementsByTagName('script')
  for (let i = scripts.length - 1; i >= 0; i--) {
    const script = scripts[i] as HTMLScriptElement
    if (script.src && script.src.includes('main.js')) {
      return script
    }
  }
  return null
}

let sdkInstance: WidgetSDK | null = null
let logger = useLogger('WidgetEntry') // Will be re-initialized with debug option

const CreateStudio = {
  async init(options: { 
    apiKey?: string
    siteUrl?: string
    baseUrl?: string
    debug?: boolean
    version?: string
  } = {}) {
    // Load CSS first
    loadWidgetCSS()
    
    if (sdkInstance) {
      logger.warn('Create Studio already initialized')
      return sdkInstance
    }

    // Get version from URL parameter (for debugging/testing)
    const versionFromUrl = getUrlParam('studioVersion')
    const finalOptions = {
      ...options,
      version: versionFromUrl || options.version || 'latest'
    }
    
    // Re-initialize logger with debug option
    logger = useLogger('WidgetEntry', finalOptions.debug)
    logger.debug('Initializing Create Studio with options:', finalOptions)

    if (finalOptions.version !== 'latest') {
      logger.debug(`Version override: ${finalOptions.version}`)
    }
    sdkInstance = new WidgetSDK(finalOptions)
    await sdkInstance.init()
    return sdkInstance
  },

  async mount(type: string, selector: string, config?: any) {
    logger.debug(`Mounting widget of type "${type}" on selector:`, selector, 'with config:', config)
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }

    return sdkInstance.mount({ type, selector, config })
  },

  async mountAll(type: string, selector: string, configExtractor?: (el: Element) => any) {
    logger.debug(`Mounting all widgets of type "${type}" on selector:`, selector)
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }

    return sdkInstance.mountAll(type, selector, configExtractor)
  },

  async mountInteractiveMode(selector: string = 'section[id^="mv-creation-"]') {
    logger.info(`🔍 Mounting interactive mode on selector:`, selector)
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }
    const defaultButtonSelector = '.mv-create-instructions-title'

    // Get site configuration first
    const siteConfig = await sdkInstance.getSiteConfig()
    logger.info('📋 Site config for mounting:', siteConfig)

    const sections = document.querySelectorAll(selector)
    logger.info(`📦 Found ${sections.length} sections matching selector`)
    const apps: any[] = []

    for (const section of sections) {
      logger.debug('🔎 Processing section:', section.id)

      // Extract creation ID from mv-creation-{id}
      const idMatch = section.id.match(/^mv-creation-(\d+)$/)
      const creationId = idMatch ? idMatch[1] : section.id
      logger.debug('🆔 Creation ID:', creationId)

      if (!siteConfig?.showInteractiveMode) {
        logger.warn('⚠️ Interactive mode disabled in config')
        continue
      }

      if (!creationId) {
        logger.warn('⚠️ No creation ID found')
        continue
      }

      // Find the target element within the section
      let targetElement: Element | null = null
      let isDefaultSelector = false

      if (siteConfig.buttonSelector) {
        // If custom button selector exists, mount directly on it
        targetElement = section.querySelector(siteConfig.buttonSelector)
        logger.debug('🎯 Using custom selector:', siteConfig.buttonSelector, targetElement)
      } else {
        // For default selector, we'll mount inside the h3 element
        targetElement = section.querySelector(defaultButtonSelector) || null
        isDefaultSelector = true
        logger.debug('🎯 Using default selector:', defaultButtonSelector, targetElement)
      }

      if (!targetElement) {
        const selector = siteConfig.buttonSelector || defaultButtonSelector
        logger.warn('❌ Target element not found:', selector)
        continue
      }

      // Check if widget already exists (any variant)
      const existingWidget = targetElement.querySelector('.create-studio-interactive-btn')
        || section.querySelector('.cs-interactive-mode-banner-container')
        || section.querySelector('.cs-interactive-mode-sticky-container')
        || section.querySelector('.cs-interactive-mode-tooltip-container')
      if (existingWidget) {
        logger.debug('✅ Widget already exists, skipping injection')
        continue
      }

      // Extract unit conversion config for InteractiveExperience (in-DOM mode)
      let unitConversionConfig: any = undefined
      const csConfigAttr = section.getAttribute('data-cs-config')
      if (csConfigAttr) {
        try {
          const csConfig = JSON.parse(csConfigAttr)
          if (csConfig.unitConversion?.enabled) {
            unitConversionConfig = csConfig.unitConversion
          }
        } catch { /* ignore */ }
      }
      if (!unitConversionConfig) {
        const legacyAttr = section.getAttribute('data-unit-conversions')
        if (legacyAttr) {
          try {
            const parsed = JSON.parse(legacyAttr)
            if (parsed?.enabled) unitConversionConfig = parsed
          } catch { /* ignore */ }
        }
      }

      // Remap unit conversion keys from WordPress DB IDs → flat indices so they
      // match how InteractiveExperience iterates ingredients with String(idx).
      // The DOM order of li[data-ingredient-id] matches the API iteration order.
      if (unitConversionConfig?.conversions) {
        const ingredientEls = section.querySelectorAll('.mv-create-ingredients li[data-ingredient-id]')
        const remapped: Record<string, any> = {}
        ingredientEls.forEach((li, flatIdx) => {
          const dbId = li.getAttribute('data-ingredient-id')
          if (dbId && unitConversionConfig.conversions[dbId]) {
            remapped[String(flatIdx)] = unitConversionConfig.conversions[dbId]
          }
        })
        unitConversionConfig = { ...unitConversionConfig, conversions: remapped }
      }

      // Determine CTA variant from site config (Pro tier only, defaults to 'button')
      const ctaVariant = siteConfig.ctaVariant || 'button'

      const config = {
        creationId,
        buttonText: section.getAttribute('data-button-text') || siteConfig.buttonText || 'Try Interactive Mode!',
        ctaVariant,
        ctaTitle: siteConfig.ctaTitle || '',
        ctaSubtitle: siteConfig.ctaSubtitle || '',
        siteUrl: sdkInstance.getSiteUrl(),
        embedUrl: sdkInstance.getEmbedUrl(),
        theme: section.getAttribute('data-theme') ? JSON.parse(section.getAttribute('data-theme')!) : {},
        unitConversion: unitConversionConfig
      }
      logger.info('⚙️ Widget config:', config)

      // Mount target depends on the CTA variant
      let mountTarget: Element = targetElement

      if (ctaVariant === 'inline-banner') {
        // Insert between ingredients and instructions sections
        const ingredientsSection = section.querySelector('.mv-create-ingredients')
        const instructionsSection = section.querySelector('.mv-create-instructions')
        if (ingredientsSection && instructionsSection) {
          const bannerContainer = document.createElement('div')
          bannerContainer.className = 'create-studio-widget cs-interactive-mode-banner-container ezoic-no-insert adthrive-no-insert'
          bannerContainer.setAttribute('data-no-optimize', 'true')
          bannerContainer.setAttribute('data-nosnippet', '')
          bannerContainer.setAttribute('data-ad-frequency-hint', '0')
          instructionsSection.parentElement?.insertBefore(bannerContainer, instructionsSection)
          mountTarget = bannerContainer
          logger.debug('📦 Created banner container between ingredients and instructions')
        }
      } else if (ctaVariant === 'sticky-bar') {
        // Place inside the section (fixed positioning + intersection observer handles visibility)
        const wrapper = section.querySelector('.mv-create-wrapper') || section
        const stickyContainer = document.createElement('div')
        stickyContainer.className = 'create-studio-widget cs-interactive-mode-sticky-container'
        wrapper.appendChild(stickyContainer)
        mountTarget = stickyContainer
        logger.debug('📦 Created sticky bar container in wrapper')
      } else if (ctaVariant === 'tooltip') {
        // Mount inline inside the instructions heading, to the right of the text
        const instructionsTitle = section.querySelector('.mv-create-instructions-title')
        if (instructionsTitle) {
          // Add a class so we can target it with CSS
          instructionsTitle.classList.add('cs-interactive-mode-tooltip-heading')

          // Inject a style element for the heading layout + responsive rules
          if (!document.querySelector('#cs-interactive-mode-tooltip-styles')) {
            const style = document.createElement('style')
            style.id = 'cs-interactive-mode-tooltip-styles'
            style.textContent = `
              .cs-interactive-mode-tooltip-heading {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                flex-wrap: wrap !important;
              }
              @media (max-width: 639px) {
                .cs-interactive-mode-tooltip-heading {
                  gap: 0 !important;
                }
              }
            `
            document.head.appendChild(style)
          }

          const tooltipContainer = document.createElement('span')
          tooltipContainer.className = 'create-studio-widget cs-interactive-mode-tooltip-container'
          tooltipContainer.style.flexShrink = '0'
          instructionsTitle.appendChild(tooltipContainer)
          mountTarget = tooltipContainer
          logger.debug('📦 Created tooltip container beside instructions title')
        }
      } else {
        // Default 'button' variant - current behavior
        if (isDefaultSelector) {
          const buttonContainer = document.createElement('span')
          buttonContainer.style.marginLeft = '0.5rem'
          buttonContainer.style.display = 'inline-block'
          targetElement.appendChild(buttonContainer)
          mountTarget = buttonContainer
          logger.debug('📦 Created button container in h3')
        }
      }

      logger.info('🚀 Mounting widget...')
      const app = await sdkInstance.mount({ type: 'interactive-mode', selector: mountTarget, config })
      if (app) {
        logger.info('✅ Widget mounted successfully')
        apps.push(app)
        // Sync ingredient checklists between card and interactive mode
        const siteUrl = sdkInstance.getSiteUrl()
        const domain = normalizeDomain(siteUrl)
        const creationKey = createCreationKey(domain, creationId)
        syncIngredientChecklists(section, creationKey)
      } else {
        logger.error('❌ Widget mount failed')
      }
    }

    logger.info(`✅ Mounted ${apps.length} widgets total`)
    return apps
  },

  async mountServingsAdjuster(selector: string = 'section[id^="mv-creation-"]') {
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }

    // Check if servings adjustment is enabled for this tier
    const siteConfig = await sdkInstance.getSiteConfig()
    if (siteConfig?.features?.servingsAdjustment === false) {
      logger.debug('Servings adjustment disabled for this tier')
      return []
    }

    const sections = document.querySelectorAll(selector)
    const apps: any[] = []

    for (const section of sections) {
      // Extract creation ID from mv-creation-{id}
      const idMatch = section.id.match(/^mv-creation-(\d+)$/)
      const creationId = idMatch ? idMatch[1] : section.id

      if (!creationId) {
        continue
      }

      // Try consolidated config first, then fall back to legacy attribute
      let servingsLabel: string | undefined
      let defaultMultiplier = 1
      let servingsEnabled = false

      const csConfigAttr = section.getAttribute('data-cs-config')
      if (csConfigAttr) {
        try {
          const csConfig = JSON.parse(csConfigAttr)
          if (csConfig.servingsAdjustment?.enabled) {
            servingsEnabled = true
            servingsLabel = csConfig.servingsAdjustment.label
            defaultMultiplier = csConfig.servingsAdjustment.defaultMultiplier || 1
          }
        } catch { /* ignore parse errors */ }
      }

      // Fallback to legacy attributes
      if (!servingsEnabled) {
        const servingsAdjustment = section.getAttribute('data-servings-adjustment')
        if (!servingsAdjustment) continue
        servingsEnabled = true
        defaultMultiplier = parseInt(servingsAdjustment) || 1
        servingsLabel = section.getAttribute('data-servings-label') || undefined
      }

      if (!servingsEnabled) continue

      // Find the ingredients section to place the adjuster before it
      const ingredientsSection = section.querySelector('.mv-create-ingredients')
      if (!ingredientsSection) {
        logger.warn('Create Studio: Ingredients section not found for servings adjuster')
        continue
      }

      // Check if adjuster already exists
      const existingAdjuster = section.querySelector('.cs-servings-adjuster')
      if (existingAdjuster) {
        logger.debug('Create Studio: Servings adjuster already exists, skipping injection')
        continue
      }

      // Create container for the adjuster before ingredients section
      const adjusterContainer = document.createElement('div')
      adjusterContainer.className = 'create-studio-widget cs-servings-adjuster-container'

      // Insert before the ingredients section
      ingredientsSection.parentElement?.insertBefore(adjusterContainer, ingredientsSection)

      const config = {
        creationId,
        defaultMultiplier,
        siteUrl: sdkInstance.getSiteUrl(),
        theme: section.getAttribute('data-theme') ? JSON.parse(section.getAttribute('data-theme')!) : {},
        label: servingsLabel
      }

      const app = await sdkInstance.mount({ type: 'servings-adjuster', selector: adjusterContainer, config })
      if (app) apps.push(app)
    }

    return apps
  },

  async mountUnitConversion(selector: string = 'section[id^="mv-creation-"]') {
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }

    // Check if unit conversion is enabled for this tier
    const siteConfig = await sdkInstance.getSiteConfig()
    if (siteConfig?.features?.unitConversion === false) {
      logger.debug('Unit conversion disabled for this tier')
      return []
    }

    const sections = document.querySelectorAll(selector)
    const apps: any[] = []

    for (const section of sections) {
      // Extract creation ID from mv-creation-{id}
      const idMatch = section.id.match(/^mv-creation-(\d+)$/)
      const creationId = idMatch ? idMatch[1] : section.id

      if (!creationId) continue

      // Try consolidated config first, then fall back to legacy attribute
      let unitConversionConfig: any = null
      const csConfigAttr = section.getAttribute('data-cs-config')
      if (csConfigAttr) {
        try {
          const csConfig = JSON.parse(csConfigAttr)
          unitConversionConfig = csConfig.unitConversion
        } catch { /* ignore parse errors */ }
      }

      if (!unitConversionConfig) {
        const legacyAttr = section.getAttribute('data-unit-conversions')
        if (legacyAttr) {
          try {
            unitConversionConfig = JSON.parse(legacyAttr)
          } catch { /* ignore parse errors */ }
        }
      }

      if (!unitConversionConfig || !unitConversionConfig.enabled) continue

      // Find the ingredients section
      const ingredientsContainer = section.querySelector('.mv-create-ingredients')
      if (!ingredientsContainer) continue

      // Avoid duplicate initialization
      if (section.querySelector('.cs-unit-conversion')) continue

      // Find or create the ingredients header wrapper
      let headerWrapper = ingredientsContainer.querySelector('.mv-create-ingredients-header')
      const ingredientsTitle = ingredientsContainer.querySelector('.mv-create-ingredients-title')

      if (!headerWrapper && ingredientsTitle) {
        // Create flex wrapper to contain both title and toggle (same as Preact code)
        headerWrapper = document.createElement('div')
        headerWrapper.className = 'mv-create-ingredients-header'
        ingredientsTitle.parentNode?.insertBefore(headerWrapper, ingredientsTitle)
        headerWrapper.appendChild(ingredientsTitle)
      }

      if (!headerWrapper) continue

      // Create mount point for the toggle inside the flex wrapper
      const mountPoint = document.createElement('div')
      mountPoint.className = 'cs-unit-conversion-wrapper'
      headerWrapper.appendChild(mountPoint)

      const config = {
        creationId,
        siteUrl: sdkInstance.getSiteUrl(),
        theme: section.getAttribute('data-theme') ? JSON.parse(section.getAttribute('data-theme')!) : {},
        unitConversion: unitConversionConfig
      }

      const app = await sdkInstance.mount({ type: 'unit-conversion', selector: mountPoint, config })
      if (app) apps.push(app)
    }

    return apps
  },

  async mountWidgetToolbar(selector: string = 'section[id^="mv-creation-"]') {
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }

    const siteConfig = await sdkInstance.getSiteConfig()
    const sections = document.querySelectorAll(selector)
    const apps: any[] = []

    for (const section of sections) {
      const idMatch = section.id.match(/^mv-creation-(\d+)$/)
      const creationId = idMatch ? idMatch[1] : section.id
      if (!creationId) continue

      // Parse consolidated config
      let csConfig: any = null
      const csConfigAttr = section.getAttribute('data-cs-config')
      if (csConfigAttr) {
        try { csConfig = JSON.parse(csConfigAttr) } catch { /* ignore */ }
      }

      // Determine what's enabled
      let servingsEnabled = false
      let servingsLabel: string | undefined
      let defaultMultiplier = 1

      if (csConfig?.servingsAdjustment?.enabled) {
        servingsEnabled = siteConfig?.features?.servingsAdjustment !== false
        servingsLabel = csConfig.servingsAdjustment.label
        defaultMultiplier = csConfig.servingsAdjustment.defaultMultiplier || 1
      } else {
        // Legacy fallback
        const legacyServings = section.getAttribute('data-servings-adjustment')
        if (legacyServings) {
          servingsEnabled = siteConfig?.features?.servingsAdjustment !== false
          defaultMultiplier = parseInt(legacyServings) || 1
          servingsLabel = section.getAttribute('data-servings-label') || undefined
        }
      }

      let unitConversionConfig: any = null
      let unitConversionEnabled = false

      if (csConfig?.unitConversion?.enabled) {
        unitConversionEnabled = siteConfig?.features?.unitConversion !== false
        unitConversionConfig = csConfig.unitConversion
      } else {
        // Legacy fallback
        const legacyUC = section.getAttribute('data-unit-conversions')
        if (legacyUC) {
          try {
            const parsed = JSON.parse(legacyUC)
            if (parsed?.enabled) {
              unitConversionEnabled = siteConfig?.features?.unitConversion !== false
              unitConversionConfig = parsed
            }
          } catch { /* ignore */ }
        }
      }

      // Skip if nothing is enabled
      if (!servingsEnabled && !unitConversionEnabled) continue

      // Check for duplicates
      if (section.querySelector('.cs-widget-toolbar') || section.querySelector('.cs-servings-adjuster') || section.querySelector('.cs-unit-conversion')) continue

      const widgetLayout = csConfig?.widgetLayout || 'toolbar'
      const showLabels = csConfig?.showLabels !== false
      const ingredientsSection = section.querySelector('.mv-create-ingredients')
      if (!ingredientsSection) continue

      const baseTheme = section.getAttribute('data-theme') ? JSON.parse(section.getAttribute('data-theme')!) : {}
      const siteUrl = sdkInstance.getSiteUrl()

      if (widgetLayout === 'inline') {
        // Mount inside the ingredients header
        let headerWrapper = ingredientsSection.querySelector('.mv-create-ingredients-header')
        const ingredientsTitle = ingredientsSection.querySelector('.mv-create-ingredients-title')

        if (!headerWrapper && ingredientsTitle) {
          headerWrapper = document.createElement('div')
          headerWrapper.className = 'mv-create-ingredients-header'
          ingredientsTitle.parentNode?.insertBefore(headerWrapper, ingredientsTitle)
          headerWrapper.appendChild(ingredientsTitle)
        }
        if (!headerWrapper) continue

        const toolbar = document.createElement('div')
        toolbar.className = 'cs-widget-toolbar cs-widget-toolbar--inline'
        headerWrapper.appendChild(toolbar)

        if (servingsEnabled) {
          const mount = document.createElement('div')
          mount.className = 'create-studio-widget cs-servings-adjuster-container'
          toolbar.appendChild(mount)
          const app = await sdkInstance.mount({ type: 'servings-adjuster', selector: mount, config: { creationId, defaultMultiplier, siteUrl, theme: baseTheme, label: servingsLabel, showLabel: false } })
          if (app) apps.push(app)
        }

        if (unitConversionEnabled) {
          const mount = document.createElement('div')
          mount.className = 'cs-unit-conversion-wrapper'
          toolbar.appendChild(mount)
          const ucConfig = { ...unitConversionConfig, showLabel: false }
          const app = await sdkInstance.mount({ type: 'unit-conversion', selector: mount, config: { creationId, siteUrl, theme: baseTheme, unitConversion: ucConfig } })
          if (app) apps.push(app)
        }
      } else {
        // toolbar or centered — mount before ingredients
        const toolbar = document.createElement('div')
        toolbar.className = `cs-widget-toolbar cs-widget-toolbar--${widgetLayout}`
        ingredientsSection.parentElement?.insertBefore(toolbar, ingredientsSection)

        if (servingsEnabled) {
          const mount = document.createElement('div')
          mount.className = 'create-studio-widget cs-servings-adjuster-container'
          toolbar.appendChild(mount)
          const app = await sdkInstance.mount({ type: 'servings-adjuster', selector: mount, config: { creationId, defaultMultiplier, siteUrl, theme: baseTheme, label: servingsLabel, showLabel: showLabels } })
          if (app) apps.push(app)
        }

        if (unitConversionEnabled) {
          const mount = document.createElement('div')
          mount.className = 'cs-unit-conversion-wrapper'
          toolbar.appendChild(mount)
          const ucConfig = { ...unitConversionConfig, showLabel: showLabels }
          const app = await sdkInstance.mount({ type: 'unit-conversion', selector: mount, config: { creationId, siteUrl, theme: baseTheme, unitConversion: ucConfig } })
          if (app) apps.push(app)
        }
      }
    }

    return apps
  },

  getPreferences() {
    return sdkInstance?.getPreferences() || {}
  },

  updatePreferences(prefs: any) {
    sdkInstance?.updatePreferences(prefs)
  },

  updateTheme(theme: Record<string, string>) {
    sdkInstance?.updateTheme(theme)
  },

  getVersion() {
    return sdkInstance?.getVersion() || 'unknown'
  },

  getBuildTime() {
    // @ts-ignore - __BUILD_TIME__ is injected at build time
    return typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString()
  },

  getWidgetVersion() {
    // @ts-ignore - __CREATE_STUDIO_VERSION__ is injected at build time
    return typeof __CREATE_STUDIO_VERSION__ !== 'undefined' ? __CREATE_STUDIO_VERSION__ : '1.0.0'
  }
} 


// Handle messages from iframe (for cross-domain storage access)
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
  
    // Handle unit preference requests from iframe
    if (event.data.type === 'REQUEST_UNIT_PREFERENCE') {
      const { messageId } = event.data

      const storageKey = 'create-studio'
      try {
        const storage = localStorage.getItem(storageKey)
        let unitPreference: string | undefined

        if (storage) {
          const parsed = JSON.parse(storage)
          unitPreference = parsed.preferences?.units
        }

        if (event.source) {
          (event.source as Window).postMessage({
            type: 'UNIT_PREFERENCE_RESPONSE',
            messageId,
            unitPreference
          }, event.origin)
        }
      } catch (error) {
        if (event.source) {
          (event.source as Window).postMessage({
            type: 'UNIT_PREFERENCE_RESPONSE',
            messageId,
            unitPreference: undefined
          }, event.origin)
        }
      }
    }

    if (event.data.type === 'REQUEST_SERVINGS_MULTIPLIER') {
      const { messageId, creationKey } = event.data
      
      // Get servings multiplier from local storage
      const storageKey = 'create-studio'
      try {
        const storage = localStorage.getItem(storageKey)
        let multiplier = 1
        
        if (storage) {
          const parsed = JSON.parse(storage)
          const state = parsed.state?.[creationKey]
          multiplier = state?.servingsMultiplier || 1
        }
        
        // Send response back to iframe
        if (event.source) {
          (event.source as Window).postMessage({
            type: 'SERVINGS_MULTIPLIER_RESPONSE',
            messageId,
            multiplier
          }, event.origin)
        }
        
      } catch (error) {
        // Send fallback response
        if (event.source) {
          (event.source as Window).postMessage({
            type: 'SERVINGS_MULTIPLIER_RESPONSE',
            messageId,
            multiplier: 1
          }, event.origin)
        }
      }
    }
  })
}

// Auto-initialization from script tag attributes
document.addEventListener('DOMContentLoaded', () => {
  // Load CSS first
  loadWidgetCSS()
  
  const currentScript = getCurrentScript()
  
  if (currentScript) {
    const siteUrl = currentScript.getAttribute('data-site-url')
    const debug = currentScript.hasAttribute('data-create-studio-debug') || false
    const baseUrl = currentScript.getAttribute('data-base-url')
    const apiKey = currentScript.getAttribute('data-api-key')
    
    if (siteUrl) {
      const initOptions: any = { 
        siteUrl, 
        debug 
      }
      
      if (baseUrl) initOptions.baseUrl = baseUrl
      if (apiKey) initOptions.apiKey = apiKey

      window.CreateStudio.init(initOptions)
        .then(() => {
          // Auto-mount interactive mode widgets on mv-creation elements
          window.CreateStudio.mountInteractiveMode()
          // Auto-mount widget toolbar (combines servings adjuster + unit conversion)
          window.CreateStudio.mountWidgetToolbar()
        })
    }
  }
})

// Make CreateStudio available globally
window.CreateStudio = CreateStudio

export default CreateStudio