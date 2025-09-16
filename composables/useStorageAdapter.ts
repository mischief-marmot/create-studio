/**
 * Storage adapter that handles different storage scenarios including iframes
 */

import { useLogger } from '~/utils/logger'

const logger = useLogger('StorageAdapter')

interface StorageAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  isAvailable(): boolean
}

class LocalStorageAdapter implements StorageAdapter {
  isAvailable(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      logger.warn('localStorage not available, data will not persist')
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      // Silent fail
    }
  }
}

class SessionStorageAdapter implements StorageAdapter {
  isAvailable(): boolean {
    try {
      const test = '__sessionStorage_test__'
      sessionStorage.setItem(test, test)
      sessionStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  }

  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value)
    } catch {
      logger.warn('sessionStorage not available')
    }
  }

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key)
    } catch {
      // Silent fail
    }
  }
}

class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>()

  isAvailable(): boolean {
    return true
  }

  getItem(key: string): string | null {
    return this.storage.get(key) || null
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value)
  }

  removeItem(key: string): void {
    this.storage.delete(key)
  }
}

export const useStorageAdapter = (): StorageAdapter => {
  if (typeof window === 'undefined') {
    // SSR - use memory storage
    return new MemoryStorageAdapter()
  }

  // Detect iframe context
  const isInIframe = window !== window.top

  if (isInIframe) {
    logger.debug('Detected iframe context, checking storage availability...')
  }

  // Try localStorage first
  const localStorage = new LocalStorageAdapter()
  if (localStorage.isAvailable()) {
    if (isInIframe) {
      logger.debug('localStorage available in iframe')
    }
    return localStorage
  }

  // Fallback to sessionStorage
  const sessionStorage = new SessionStorageAdapter()
  if (sessionStorage.isAvailable()) {
    logger.warn('localStorage not available, using sessionStorage (data will not persist between sessions)')
    return sessionStorage
  }

  // Final fallback to memory storage
  logger.warn('No persistent storage available, using memory storage (data will be lost on page refresh)')
  return new MemoryStorageAdapter()
}