import { createApp, type App } from 'vue'
import { consola } from 'consola'
import type { ConfigManager } from './config-manager'
import type { WidgetRegistry } from './widget-registry'
import type { StorageManager } from './storage-manager'

export interface MountContext {
  type: string
  selector: string | Element
  config?: Record<string, any>
  registry: WidgetRegistry
  configManager: ConfigManager
  storageManager: StorageManager
}

export class MountManager {
  private mountedApps = new Map<Element, App>()

  async mount(context: MountContext): Promise<App | null> {
    const { type, selector, config = {}, registry, configManager, storageManager } = context

    const container = typeof selector === 'string' 
      ? document.querySelector(selector)
      : selector

    if (!container) {
      consola.warn(`Container not found for selector:`, selector)
      return null
    }

    if (this.mountedApps.has(container)) {
      consola.warn('Widget already mounted on this element:', container)
      return this.mountedApps.get(container) || null
    }

    if (!configManager.isWidgetTypeAllowed(type)) {
      consola.warn(`Widget type "${type}" not allowed for this account`)
      return null
    }

    try {
      const WidgetComponent = await registry.loadWidget(type)
      
      const widgetConfig = configManager.getWidgetConfig(type, config)
      
      const app = createApp(WidgetComponent, {
        config: widgetConfig,
        storage: storageManager
      })

      app.provide('widgetStorage', storageManager)
      app.provide('widgetConfig', widgetConfig)
      app.provide('widgetTheme', configManager.getTheme())

      app.mount(container)
      
      this.mountedApps.set(container, app)

      if (configManager.isDebug()) {
        consola.debug(`🎯 Mounted ${type} widget on:`, container)
      }

      return app
    } catch (error) {
      consola.error(`Failed to mount ${type} widget:`, error)
      return null
    }
  }

  unmount(container: Element): boolean {
    const app = this.mountedApps.get(container)
    if (!app) return false

    app.unmount()
    this.mountedApps.delete(container)
    return true
  }

  unmountAll(): void {
    this.mountedApps.forEach((app, container) => {
      app.unmount()
    })
    this.mountedApps.clear()
  }

  getMountedWidgets(): Element[] {
    return Array.from(this.mountedApps.keys())
  }
}