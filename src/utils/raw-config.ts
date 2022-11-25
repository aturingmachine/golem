import { readFileSync } from 'fs'
import path from 'path'
import YAML from 'yaml'
import { ConfigurationOptions } from '../core/configuration'

export enum GolemModule {
  LocalMusic = 'LocalMusic',
  Youtube = 'Youtube',
  Plex = 'Plex',
}

export class RawConfig {
  private static _settings: ConfigurationOptions

  public static get settings(): ConfigurationOptions {
    if (!RawConfig._settings) {
      RawConfig._settings = YAML.parse(
        readFileSync(path.resolve(__dirname, '../../config.yml'), {
          encoding: 'utf-8',
        })
      )
    }

    return RawConfig._settings
  }

  public static get modules(): GolemModule[] {
    const modules = []

    if (RawConfig.hasLocalMusicModule) {
      modules.push(GolemModule.LocalMusic)
    }

    if (RawConfig.settings.youtube?.ytdlpPath) {
      modules.push(GolemModule.Youtube)
    }

    if (RawConfig.settings.plex?.username && RawConfig.settings.plex.password) {
      modules.push(GolemModule.Plex)
    }

    return modules
  }

  public static get hasLocalMusicModule(): boolean {
    const settings = RawConfig.settings

    return (
      typeof settings.library === 'object' &&
      !!settings.library?.paths &&
      Array.isArray(settings.library.paths) &&
      settings.library.paths.length > 0
    )
  }
}
