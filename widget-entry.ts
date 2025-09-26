import './widget.css'
import { WidgetSDK } from './shared/lib/widget-sdk'
import { useLogger } from './shared/utils/logger'

// Function to dynamically load CSS
function loadWidgetCSS() {
  // Check if CSS is already loaded
  if (document.querySelector('link[href*="widget-entry.css"]')) {
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
  const debug = scriptTag.hasAttribute('data-create-studio-debug')
  // Add cache-busting parameter for development
  const cacheBust = new Date().getTime()
  link.href = `${baseUrl}/embed/widget-entry.css${debug ? '?v=' + cacheBust : ''}`
  document.head.appendChild(link)
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
    logger.debug(`Mounting interactive mode on selector:`, selector)
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }
    const defaultButtonSelector = '.mv-create-instructions-title'

    // Get site configuration first
    const siteConfig = await sdkInstance.getSiteConfig()
    
    const sections = document.querySelectorAll(selector)
    const apps: any[] = []

    for (const section of sections) {
      // Extract creation ID from mv-creation-{id}
      const idMatch = section.id.match(/^mv-creation-(\d+)$/)
      const creationId = idMatch ? idMatch[1] : section.id

      if (!siteConfig?.showInteractiveMode || !creationId) {
        continue
      }

      // Find the target element within the section
      let targetElement: Element | null = null
      let isDefaultSelector = false
      
      if (siteConfig.buttonSelector) {
        // If custom button selector exists, mount directly on it
        targetElement = section.querySelector(siteConfig.buttonSelector)
      } else {
        // For default selector, we'll mount inside the h3 element
        targetElement = section.querySelector(defaultButtonSelector) || null
        isDefaultSelector = true
      }
      
      if (!targetElement) {
        const selector = siteConfig.buttonSelector || defaultButtonSelector
        logger.warn('Create Studio: Target element not found:', selector)
        continue
      }

      // Check if button already exists
      const existingButton = targetElement.querySelector('.create-studio-interactive-btn')
      if (existingButton) {
        logger.debug('Create Studio: Button already exists, skipping injection')
        continue
      }

      const config = {
        creationId,
        buttonText: section.getAttribute('data-button-text') || siteConfig.buttonText || 'Try Interactive Mode!',
        siteUrl: sdkInstance.getSiteUrl(),
        embedUrl: sdkInstance.getEmbedUrl(),
        theme: section.getAttribute('data-theme') ? JSON.parse(section.getAttribute('data-theme')!) : {}
      }

      // For default selector (h3), create a container inside the h3 to mount the widget
      let mountTarget = targetElement
      if (isDefaultSelector) {
        const buttonContainer = document.createElement('span')
        buttonContainer.style.marginLeft = '0.5rem'
        buttonContainer.style.display = 'inline-block'
        targetElement.appendChild(buttonContainer)
        mountTarget = buttonContainer
      }

      const app = await sdkInstance.mount({ type: 'interactive-mode', selector: mountTarget, config })
      if (app) apps.push(app)
    }

    return apps
  },

  async mountServingsAdjuster(selector: string = 'section[id^="mv-creation-"][data-servings-adjustment]') {
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
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

      // Check if servings adjuster should be shown
      const servingsAdjustment = section.getAttribute('data-servings-adjustment')
      if (!servingsAdjustment) {
        continue
      }

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
        defaultMultiplier: parseInt(servingsAdjustment) || 1,
        siteUrl: sdkInstance.getSiteUrl(),
        theme: section.getAttribute('data-theme') ? JSON.parse(section.getAttribute('data-theme')!) : {}
      }

      const app = await sdkInstance.mount({ type: 'servings-adjuster', selector: adjusterContainer, config })
      if (app) apps.push(app)
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
          // Auto-mount servings adjuster widgets
          window.CreateStudio.mountServingsAdjuster()
        })
    }
  }
})

// Make CreateStudio available globally
window.CreateStudio = CreateStudio

export default CreateStudio