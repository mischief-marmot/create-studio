import { type App } from 'vue'
import { type ConsolaInstance } from 'consola'
import { ConfigManager } from './config-manager'
import { WidgetRegistry } from './widget-registry'
import { MountManager } from './mount-manager'
import { StorageManager } from './storage-manager'
import { useLogger } from '@create-studio/shared/utils/logger'
import { swManager } from '@create-studio/shared/lib/service-worker/sw-manager'

export interface WidgetSDKOptions {
  apiKey?: string
  siteUrl?: string
  baseUrl?: string
  debug?: boolean
  storagePrefix?: string
  version?: string
}

export interface MountOptions {
  type: string
  selector: string | Element
  config?: Record<string, any>
  autoMount?: boolean
}

class WidgetSDK {
  private configManager: ConfigManager
  private registry: WidgetRegistry
  private mountManager: MountManager
  private storageManager: StorageManager
  private initialized = false
  private themeStyleElement: HTMLStyleElement | null = null
  private version: string
  private logger: ConsolaInstance

  constructor(options: WidgetSDKOptions) {
    this.configManager = new ConfigManager(options)
    this.registry = new WidgetRegistry()
    this.mountManager = new MountManager()
    this.storageManager = new StorageManager(options.storagePrefix || 'create-studio')
    this.version = options.version || 'latest'
    this.logger = useLogger('WidgetSDK', options.debug)

    this.registerBuiltInWidgets()
  }

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      await this.configManager.loadSiteConfig()
      await this.storageManager.init()

      // Register Service Worker for background timer processing
      // Only register if we're on the app domain (where sw.js exists)
      try {
        if (swManager && this.configManager.getBaseUrl()) {
          const baseUrl = this.configManager.getBaseUrl()
          const currentOrigin = window.location.origin

          // Only register SW if we're on the same origin as the app
          if (baseUrl.startsWith(currentOrigin)) {
            this.logger.info('🔧 Initializing Service Worker for widgets...')
            await swManager.register('/sw.js')
            if (swManager.isReady()) {
              this.logger.info('✅ Service Worker ready for background timer processing')
            }
          } else {
            this.logger.info('ℹ️  Skipping Service Worker registration (embedded on external site)')
          }
        }
      } catch (error) {
        // Service Worker registration is optional, don't block widget initialization
        this.logger.warn('⚠️  Service Worker registration failed (widgets will still work):', error)
      }

      this.injectThemeStyles()
      this.autoMountWidgets()

      this.initialized = true

      if (this.configManager.isDebug()) {
        this.logger.info(`🚀 Create Studio SDK initialized (version: ${this.version})`)
      }
    } catch (error) {
      this.logger.error('Failed to initialize Widget SDK:', error)
      throw error
    }
  }

  private injectThemeStyles(): void {
    const theme = this.configManager.getTheme()
    
    if (this.themeStyleElement) {
      this.themeStyleElement.remove()
    }

    this.themeStyleElement = document.createElement('style')
    this.themeStyleElement.id = 'create-studio-theme'
    
    const cssVars = Object.entries(theme)
      .map(([key, value]) => {
        const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `--cs-${cssVarName}: ${value};`
      })
      .join('\n  ')

    this.themeStyleElement.innerHTML = `
      .create-studio-widget-root {
        ${cssVars}
      }
      
      .create-studio-widget-root * {
        font-family: var(--cs-font-family);
      }

      .create-studio-btn {
        background-color: var(--cs-primary);
        color: white;
        border: none;
        border-radius: var(--cs-border-radius);
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .create-studio-btn:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .create-studio-btn-secondary {
        background-color: var(--cs-secondary);
      }

      .create-studio-modal {
        background-color: var(--cs-base-100);
        color: var(--cs-base-content);
        border-radius: var(--cs-border-radius);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      .create-studio-modal-overlay {
        background-color: rgba(0, 0, 0, 0.5);
      }
    `

    document.head.appendChild(this.themeStyleElement)
  }

  async mount(options: MountOptions): Promise<App | null> {
    if (!this.initialized) {
      await this.init()
    }

    return this.mountManager.mount({
      ...options,
      registry: this.registry,
      configManager: this.configManager,
      storageManager: this.storageManager
    })
  }

  async mountAll(type: string, selector: string, configExtractor?: (element: Element) => Record<string, any>): Promise<App[]> {
    if (!this.initialized) {
      await this.init()
    }

    const elements = document.querySelectorAll(selector)
    const apps: App[] = []

    for (const element of elements) {
      const config = configExtractor ? configExtractor(element) : {}
      const app = await this.mount({
        type,
        selector: element,
        config
      })
      if (app) apps.push(app)
    }

    return apps
  }

  getPreferences(): any {
    return this.storageManager.getPreferences()
  }

  updatePreferences(preferences: Record<string, any>): void {
    this.storageManager.updatePreferences(preferences)
  }

  updateTheme(theme: Record<string, string>): void {
    const currentConfig = this.configManager.getSiteConfig()
    if (currentConfig) {
      currentConfig.theme = { ...currentConfig.theme, ...theme }
      this.injectThemeStyles()
    }
  }

  getVersion(): string {
    return this.version
  }

  async getSiteConfig(): Promise<any> {
    if (!this.initialized) {
      await this.init()
    }
    return this.configManager.getSiteConfig()
  }

  getSiteUrl(): string {
    const baseConfig = this.configManager.getBaseConfig()
    return baseConfig.siteUrl || window.location.origin
  }

  getEmbedUrl(): string {
    return this.configManager.getBaseUrl()
  }

  private registerBuiltInWidgets(): void {
    this.registry.registerWidget('interactive-mode', () => import('../../components/InteractiveMode/InteractiveModeWidget.vue'))
    this.registry.registerWidget('interactive-experience', () => import('../../components/InteractiveExperience.vue'))
    this.registry.registerWidget('servings-adjuster', () => import('../../components/ServingsAdjuster/ServingsAdjusterWidget.vue'))
  }

  private autoMountWidgets(): void {
    const autoMountElements = document.querySelectorAll('[data-create-studio-widget]')
    
    autoMountElements.forEach(async (element) => {
      const type = element.getAttribute('data-create-studio-widget')
      if (!type) return

      const config = this.extractConfigFromElement(element)
      
      await this.mount({
        type,
        selector: element,
        config,
        autoMount: true
      })
    })
  }

  private extractConfigFromElement(element: Element): Record<string, any> {
    const config: Record<string, any> = {}
    
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('data-create-studio-')) {
        const key = attr.name.replace('data-create-studio-', '').replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        
        try {
          config[key] = JSON.parse(attr.value)
        } catch {
          config[key] = attr.value
        }
      }
    })

    return config
  }
}

export { WidgetSDK, ConfigManager, WidgetRegistry, MountManager, StorageManager }