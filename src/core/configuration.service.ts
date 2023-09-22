import get from 'lodash/get'
import set from 'lodash/set'
import configuration, { ConfigurationOptions } from './configuration'

export class ConfigurationService {
  private static _resolvedConfig: ConfigurationOptions

  static init(): void {
    ConfigurationService._resolvedConfig = ConfigurationService.raw
  }

  static get raw(): ConfigurationOptions {
    return configuration()
  }

  static get resolved(): ConfigurationOptions {
    if (!ConfigurationService._resolvedConfig) {
      ConfigurationService._resolvedConfig = ConfigurationService.raw
    }

    return {
      ...ConfigurationService._resolvedConfig,
      discord: {
        ...ConfigurationService._resolvedConfig.discord,
        token: undefined,
      },
      plex: {
        uri: ConfigurationService._resolvedConfig.plex?.uri,
      },
    } as unknown as ConfigurationOptions
  }

  static set(path: string, value: unknown): void {
    console.log(`Setting ${path} to ${value}`)
    set(ConfigurationService._resolvedConfig, path, value)

    console.log(
      `Should be set ${get(ConfigurationService._resolvedConfig, path)}`
    )
  }

  static get debug(): boolean {
    return this._resolvedConfig?.logLevels?.includes('debug')
  }
}
