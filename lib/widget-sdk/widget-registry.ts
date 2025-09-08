export type WidgetComponent = () => Promise<{ default: any }>

export class WidgetRegistry {
  private widgets = new Map<string, WidgetComponent>()
  private loadedWidgets = new Map<string, any>()

  registerWidget(type: string, componentLoader: WidgetComponent): void {
    this.widgets.set(type, componentLoader)
  }

  async loadWidget(type: string): Promise<any> {
    if (this.loadedWidgets.has(type)) {
      return this.loadedWidgets.get(type)
    }

    const loader = this.widgets.get(type)
    if (!loader) {
      throw new Error(`Widget type "${type}" not registered`)
    }

    try {
      const module = await loader()
      const component = module.default
      
      this.loadedWidgets.set(type, component)
      
      return component
    } catch (error) {
      throw new Error(`Failed to load widget "${type}": ${error}`)
    }
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.widgets.keys())
  }

  isRegistered(type: string): boolean {
    return this.widgets.has(type)
  }
}