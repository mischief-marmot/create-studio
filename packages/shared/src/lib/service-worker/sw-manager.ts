/**
 * Service Worker Manager for Create Studio
 * Handles timer background processing and push notifications
 */

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null
  private isSupported: boolean = false

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator
  }

  /**
   * Register the service worker
   */
  async register(swPath: string = '/sw.js'): Promise<boolean> {
    if (!this.isSupported) {
      console.log('[SW Manager] Service workers not supported')
      return false
    }

    try {
      // First, check if there's already a registration (e.g., from parent window)
      const existingRegistration = await navigator.serviceWorker.getRegistration('/')

      if (existingRegistration) {
        console.log('[SW Manager] Found existing service worker registration')
        this.registration = existingRegistration

        // Wait for it to be ready
        const readyRegistration = await navigator.serviceWorker.ready
        this.registration = readyRegistration

        console.log('[SW Manager] ✅ Using existing service worker!')
        this.setupMessageListener()
        return true
      }

      console.log('[SW Manager] Registering new service worker:', swPath)

      this.registration = await navigator.serviceWorker.register(swPath, {
        scope: '/'
      })

      console.log('[SW Manager] Service worker registered, state:', this.registration.installing?.state || this.registration.waiting?.state || this.registration.active?.state)

      // Wait for the service worker to be ready (fully activated)
      const readyRegistration = await navigator.serviceWorker.ready
      this.registration = readyRegistration

      console.log('[SW Manager] ✅ Service worker is active and ready!')

      // Set up message listener
      this.setupMessageListener()

      return true
    } catch (error) {
      console.error('[SW Manager] Service worker registration failed:', error)
      return false
    }
  }

  /**
   * Setup message listener for SW messages
   */
  private setupMessageListener(): void {
    if (!navigator.serviceWorker) return

    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW Manager] Message from SW:', event.data)

      const { type, data } = event.data

      // Dispatch custom events for different message types
      switch (type) {
        case 'TIMER_COMPLETED':
          window.dispatchEvent(new CustomEvent('sw:timer-completed', { detail: data }))
          break

        case 'PLAY_TIMER_ALARM':
          window.dispatchEvent(new CustomEvent('sw:play-alarm', { detail: data }))
          break

        case 'TIMER_REGISTERED':
          window.dispatchEvent(new CustomEvent('sw:timer-registered', { detail: data }))
          break

        case 'ACTIVE_TIMERS':
          window.dispatchEvent(new CustomEvent('sw:active-timers', { detail: data }))
          break
      }
    })
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[SW Manager] Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      console.log('[SW Manager] Notification permission:', permission)
      return permission
    }

    return Notification.permission
  }

  /**
   * Register a timer with the service worker
   */
  async registerTimer(timerData: {
    timerId: string
    duration: number
    label: string
    stepIndex?: number
  }): Promise<void> {
    if (!this.registration?.active) {
      console.warn('[SW Manager] Service worker not active, cannot register timer')
      return
    }

    console.log('[SW Manager] Registering timer with SW:', timerData)

    this.registration.active.postMessage({
      type: 'REGISTER_TIMER',
      data: timerData
    })
  }

  /**
   * Update timer state in service worker
   */
  async updateTimer(timerData: {
    timerId: string
    remaining: number
    status: 'running' | 'paused' | 'completed'
  }): Promise<void> {
    if (!this.registration?.active) return

    console.log('[SW Manager] Updating timer in SW:', timerData)

    this.registration.active.postMessage({
      type: 'UPDATE_TIMER',
      data: timerData
    })
  }

  /**
   * Cancel a timer in the service worker
   */
  async cancelTimer(timerId: string): Promise<void> {
    if (!this.registration?.active) return

    console.log('[SW Manager] Canceling timer in SW:', timerId)

    this.registration.active.postMessage({
      type: 'CANCEL_TIMER',
      data: { timerId }
    })
  }

  /**
   * Sync storage state with service worker
   */
  async syncStorage(storage: any): Promise<void> {
    if (!this.registration?.active) return

    this.registration.active.postMessage({
      type: 'SYNC_STORAGE',
      data: { storage }
    })
  }

  /**
   * Get active timers from service worker
   */
  async getActiveTimers(): Promise<any[]> {
    if (!this.registration?.active) return []

    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'ACTIVE_TIMERS') {
          navigator.serviceWorker.removeEventListener('message', handleMessage)
          resolve(event.data.data.timers)
        }
      }

      navigator.serviceWorker.addEventListener('message', handleMessage)

      this.registration!.active!.postMessage({
        type: 'GET_ACTIVE_TIMERS'
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', handleMessage)
        resolve([])
      }, 5000)
    })
  }

  /**
   * Check if service worker is ready
   */
  isReady(): boolean {
    if (!this.registration) {
      console.log('[SW Manager] ⚠️  No registration found')
      return false
    }

    if (!this.registration.active) {
      console.log('[SW Manager] ⚠️  Service worker not yet active')
      return false
    }

    return true
  }

  /**
   * Unregister service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) return false

    try {
      const result = await this.registration.unregister()
      console.log('[SW Manager] Service worker unregistered:', result)
      this.registration = null
      return result
    } catch (error) {
      console.error('[SW Manager] Failed to unregister service worker:', error)
      return false
    }
  }
}

// Export singleton instance (only instantiate on client side)
export const swManager = typeof window !== 'undefined' ? new ServiceWorkerManager() : null as any as ServiceWorkerManager
