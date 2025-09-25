import { createConsola, type ConsolaInstance } from 'consola'

export const useLogger = (tag?: string, debug: boolean = false): ConsolaInstance => {
  const logger = createConsola({
    level: debug ? 999 : 2,
    fancy: true,
    formatOptions: {
        colors: true,
        compact: !debug,
        date: debug,
    },
  });

  return tag ? logger.withTag(`CS:${tag}`) : logger.withTag('CS')
}