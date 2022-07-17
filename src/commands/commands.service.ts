import fs from 'fs'
import path from 'path'
import { Injectable } from '@nestjs/common'
import { LoggerService } from '../core/logger/logger.service'
import { Commands } from './register-commands'
import { GolemCommand } from '.'

const implementationPath = path.resolve(__dirname, './implementations')

@Injectable()
export class CommandService {
  constructor(private logger: LoggerService) {
    this.logger.setContext('command-service')
  }

  registerCommands(): void {
    fs.readdirSync(implementationPath)
      .filter(
        (file) =>
          file.endsWith('.js') &&
          !file.includes('index') &&
          !file.includes('_wip')
      )
      .forEach((file) => {
        const command: GolemCommand =
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
        // Set a new item in the Collection
        // With the key as the command name and the value as the exported module
        Commands.set(command.info.name, command)
      })
  }
}
