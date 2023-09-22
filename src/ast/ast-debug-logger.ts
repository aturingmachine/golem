import { ConfigurationService } from '../core/configuration.service'

export const ASTDebugLogger = {
  log(...args: unknown[]): void {
    if (ConfigurationService.debug) {
      console.log(`[AST DEBUG] > `, ...args)
    }
  },

  warn(...args: unknown[]): void {
    if (ConfigurationService.debug) {
      console.log(`[AST WARN] > `, ...args)
    }
  },
}
