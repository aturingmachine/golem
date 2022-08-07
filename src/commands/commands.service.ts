import fs from 'fs'
import path from 'path'
import { Injectable } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { LoggerService } from '../core/logger/logger.service'
import { Commands } from './register-commands'
import { GolemCommand } from '.'

const implementationPath = path.resolve(__dirname, './implementations')

@Injectable()
export class CommandService {
  constructor(private logger: LoggerService, private moduleRef: ModuleRef) {
    this.logger.setContext('CommandService')
  }

  async registerCommands(): Promise<void> {
    const files = fs
      .readdirSync(implementationPath)
      .filter(
        (file) =>
          file.endsWith('.js') &&
          !file.includes('index') &&
          !file.includes('_wip')
      )

    for (const file of files) {
      const command: GolemCommand<any> =
        /* eslint-disable-next-line @typescript-eslint/no-var-requires */
        require(`${implementationPath}/${file}`).default

      if (
        command.missingRequiredModules &&
        (command.missingRequiredModules.all.length > 0 ||
          command.missingRequiredModules.oneOf.length > 0)
      ) {
        this.logger.verbose(
          `skipping registering command ${
            command.options.info.name
          }; ${command.missingModulesToString()}`
        )
      }

      this.logger.verbose(`registering command ${command.options.info.name}`)

      await command.init(this.moduleRef)

      // Set a new item in the Collection
      // With the key as the command name and the value as the exported module
      Commands.set(command.info.name, command)
    }
  }
}
