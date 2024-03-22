import { Collection } from 'discord.js'
import { GolemCommand } from '.'

export const Commands = new Collection<string, GolemCommand>()

export function GetCommand(commandName: string): GolemCommand<any> {
  const target = Commands.get(commandName)

  if (!target) {
    throw new Error(`No command of name ${commandName} found.`)
  }

  return target
}

// @Injectable()
// export class CommandService {
//   constructor(private logger: GolemLogger, private config: GolemConf) {
//     this.logger.setContext('command-service')
//   }

//   registerCommands(): void {
//     GolemCommand.config = this.config

//     fs.readdirSync(implementationPath)
//       .filter(
//         (file) =>
//           file.endsWith('.js') &&
//           !file.includes('index') &&
//           !file.includes('_wip')
//       )
//       .forEach((file) => {
//         const command: GolemCommand =
//           /* eslint-disable-next-line @typescript-eslint/no-var-requires */
//           require(`${implementationPath}/${file}`).default

//         if (
//           command.missingRequiredModules &&
//           (command.missingRequiredModules.all.length > 0 ||
//             command.missingRequiredModules.oneOf.length > 0)
//         ) {
//           this.logger.verbose(
//             `skipping registering command ${
//               command.options.info.name
//             }; ${command.missingModulesToString()}`
//           )
//         }

//         this.logger.verbose(`registering command ${command.options.info.name}`)
//         // Set a new item in the Collection
//         // With the key as the command name and the value as the exported module
//         Commands.set(command.info.name, command)
//       })
//   }
// }
