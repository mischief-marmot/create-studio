import { type ConsolaInstance } from 'consola'
import { useLogger } from '../../utils/logger'

export interface ThemeConfig {
  primary?: string
  secondary?: string
  accent?: string
  neutral?: string
  base100?: string
  base200?: string
  base300?: string
  baseContent?: string
  info?: string
  success?: string
  warning?: string
  error?: string
  borderRadius?: string
  fontFamily?: string
  [key: string]: string | undefined
}

export interface SiteConfig {
  accountId: string
  features: string[]
  theme?: ThemeConfig
  branding?: {
    colors?: Record<string, string>
    logo?: string
  }
  limits?: {
    maxWidgetsPerPage?: number
    allowedWidgetTypes?: string[]
  }
  widgets?: Record<string, any>
}

export class ConfigManager {
  private siteConfig: SiteConfig | null = null
  private baseConfig: Record<string, any>
  private apiKey: string
  private baseUrl: string
  private debug: boolean
  private logger: ConsolaInstance

  constructor(options: { apiKey?: string; siteUrl?: string; baseUrl?: string; debug?: boolean }) {
    this.apiKey = options.apiKey || ''
    // Use build-time injected base URL, can be overridden by options.baseUrl
    // @ts-ignore - build-time injected values
    const defaultBaseUrl = typeof __CREATE_STUDIO_BASE_URL__ !== 'undefined' 
    // @ts-ignore - build-time injected values
      ? __CREATE_STUDIO_BASE_URL__ 
      : 'http://localhost:3001'
    this.baseUrl = options.baseUrl || defaultBaseUrl
    this.debug = options.debug || false
    this.baseConfig = {
      siteUrl: options.siteUrl
    }
    this.logger = useLogger('CS:ConfigManager', this.debug || false)
    
    this.logger.info('Widget initialized:', {
      options,
      baseUrl: this.baseUrl,
      // @ts-ignore - build-time injected values
      buildTime: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown',
      // @ts-ignore - build-time injected values
      version: typeof __CREATE_STUDIO_VERSION__ !== 'undefined' ? __CREATE_STUDIO_VERSION__ : 'unknown'
    })
  }

  async loadSiteConfig(): Promise<void> {
    if (!this.baseConfig.siteUrl && !this.apiKey) {
      this.logger.info('No siteUrl or apiKey provided, using defaults')
      this.siteConfig = {
        accountId: 'default',
        features: ['interactive-mode']
      }
      return
    }

    try {
      const payload: any = {}
      if (this.baseConfig.siteUrl) payload.siteUrl = this.baseConfig.siteUrl
      
      const headers: any = {
        'Content-Type': 'application/json'
      }
      if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`

      const response = await fetch(`${this.baseUrl}/api/site-config`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Site config API returned ${response.status}`)
      }

      const result = await response.json()
      this.siteConfig = result.config || result

      this.logger.debug('📋 Site config loaded:', this.siteConfig)
    } catch (error) {
      this.logger.warn('Failed to load site config, using defaults:', error)
      this.siteConfig = {
        accountId: 'unknown',
        features: ['interactive-mode']
      }
    }
  }

  getWidgetConfig(widgetType: string, instanceConfig: Record<string, any> = {}): Record<string, any> {
    const merged = {
      ...this.baseConfig,
      ...this.siteConfig,
      ...(this.siteConfig?.widgets?.[widgetType] || {}),
      ...instanceConfig,
      theme: this.mergeTheme(instanceConfig.theme),
      _meta: {
        apiKey: this.apiKey,
        accountId: this.siteConfig?.accountId,
        widgetType,
        debug: this.debug
      }
    }

    return merged
  }

  private mergeTheme(instanceTheme?: Partial<ThemeConfig>): ThemeConfig {
    const defaultTheme: ThemeConfig = {
      primary: '#570df8',
      secondary: '#f000b8',
      accent: '#37cdbe',
      neutral: '#3d4451',
      base100: '#ffffff',
      base200: '#f2f2f2',
      base300: '#e5e5e5',
      baseContent: '#1f2937',
      info: '#3abff8',
      success: '#36d399',
      warning: '#fbbd23',
      error: '#f87272',
      borderRadius: '0.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }

    return {
      ...defaultTheme,
      ...(this.siteConfig?.theme || {}),
      ...(instanceTheme || {})
    }
  }

  isFeatureEnabled(feature: string): boolean {
    return this.siteConfig?.features?.includes(feature) || false
  }

  isWidgetTypeAllowed(widgetType: string): boolean {
    const allowedTypes = this.siteConfig?.limits?.allowedWidgetTypes
    return !allowedTypes || allowedTypes.includes(widgetType)
  }

  isDebug(): boolean {
    return this.debug
  }

  getSiteConfig(): SiteConfig | null {
    return this.siteConfig
  }

  getTheme(): ThemeConfig {
    return this.mergeTheme()
  }

  getBaseConfig(): Record<string, any> {
    return this.baseConfig
  }

  getBaseUrl(): string {
    return this.baseUrl
  }
}