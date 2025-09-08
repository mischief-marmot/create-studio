import { WidgetSDK } from './lib/widget-sdk'

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
    if (script.src && script.src.includes('create-studio.iife.js')) {
      return script
    }
  }
  return null
}

let sdkInstance: WidgetSDK | null = null

window.CreateStudio = {
  async init(options: { 
    apiKey?: string
    siteUrl?: string
    baseUrl?: string
    debug?: boolean
    version?: string
  } = {}) {
    if (sdkInstance) {
      console.warn('Create Studio already initialized')
      return sdkInstance
    }

    // Get version from URL parameter (for debugging/testing)
    const versionFromUrl = getUrlParam('studioVersion')
    const finalOptions = {
      ...options,
      version: versionFromUrl || options.version || 'latest'
    }

    if (finalOptions.version !== 'latest') {
      console.log(`🔧 Create Studio version override: ${finalOptions.version}`)
    }

    sdkInstance = new WidgetSDK(finalOptions)
    await sdkInstance.init()
    return sdkInstance
  },

  async mount(type: string, selector: string, config?: any) {
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }

    return sdkInstance.mount({ type, selector, config })
  },

  async mountAll(type: string, selector: string, configExtractor?: (el: Element) => any) {
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }

    return sdkInstance.mountAll(type, selector, configExtractor)
  },

  async mountInteractiveMode(selector: string = 'section[id^="mv-creation-"]') {
    if (!sdkInstance) {
      throw new Error('Create Studio not initialized. Call CreateStudio.init() first.')
    }
    const defaultButtonSelector = '.mv-create-instructions > h3'

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
        console.warn('Create Studio: Target element not found:', selector)
        continue
      }

      // Check if button already exists
      const existingButton = targetElement.querySelector('.create-studio-interactive-btn')
      if (existingButton) {
        console.log('Create Studio: Button already exists, skipping injection')
        continue
      }

      const config = {
        creationId,
        recipeName: section.getAttribute('data-recipe-name') || section.querySelector('h1, h2, h3')?.textContent || 'Recipe',
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
        targetElement.appendChild(buttonContainer)
        mountTarget = buttonContainer
      }

      const app = await sdkInstance.mount({ type: 'interactive-mode', selector: mountTarget, config })
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
  }
}

// Auto-initialization from script tag attributes
document.addEventListener('DOMContentLoaded', () => {
  const currentScript = getCurrentScript()
  
  if (currentScript) {
    const siteUrl = currentScript.getAttribute('data-site-url')
    const debug = currentScript.hasAttribute('data-create-studio-debug')
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
        })
        .catch((error: any) => {
          console.error('Create Studio auto-initialization failed:', error)
        })
    }
  }
})

export default window.CreateStudio