export interface LoggerInstance {
  debug(...args: any[]): void
  info(...args: any[]): void
  success(...args: any[]): void
  start(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
  withTag(tag: string): LoggerInstance
}

class MinimalLogger implements LoggerInstance {
  private tag: string
  private level: number

  constructor(tag: string = 'CS', level: number = 2) {
    this.tag = tag
    this.level = level
  }

  debug(...args: any[]): void {
    if (this.level >= 999) console.log(`[${this.tag}]`, ...args)
  }

  info(...args: any[]): void {
    if (this.level >= 3) console.log(`[${this.tag}]`, ...args)
  }

  success(...args: any[]): void {
    if (this.level >= 3) console.log(`[${this.tag}]`, ...args)
  }

  start(...args: any[]): void {
    if (this.level >= 3) console.log(`[${this.tag}]`, ...args)
  }

  warn(...args: any[]): void {
    if (this.level >= 2) console.warn(`[${this.tag}]`, ...args)
  }

  error(...args: any[]): void {
    if (this.level >= 1) console.error(`[${this.tag}]`, ...args)
  }

  withTag(newTag: string): LoggerInstance {
    return new MinimalLogger(newTag, this.level)
  }
}

export const useLogger = (tag?: string, debug: boolean = false): LoggerInstance => {
  return new MinimalLogger(
    tag ? `CS:${tag}` : 'CS',
    debug ? 999 : 2
  )
}
