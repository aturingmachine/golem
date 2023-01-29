/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Console {
    debug(message?: any, ...optionalParams: any[]): void
  }
}

export {}
