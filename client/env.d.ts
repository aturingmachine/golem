/// <reference types="vite/client" />
declare const __API_URL__: string
declare const __API_HOST__: string


declare type Enumerable<T extends Readonly<Record<string, string>>> = {
  [K in keyof T]: T[K]
}[keyof T]
