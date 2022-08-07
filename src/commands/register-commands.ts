import { Collection } from 'discord.js'
// import { GolemConf } from '../config'
// import { LogContexts } from '../logger/constants'
// import { GolemLogger } from '../logger/logger.service'
// import goadmin from './implementations/goadmin'
// import goalias from './implementations/goalias'
// import goget from './implementations/goget'
// import gomix from './implementations/gomix'
// import gopause from './implementations/gopause'
// import gopeek from './implementations/gopeek'
// import gopermission from './implementations/gopermission'
import goplay from './implementations/goplay'
// import goplaylist from './implementations/goplaylist'
// import goplaynext from './implementations/goplaynext'
// import goreport from './implementations/goreport'
import gosearch from './implementations/gosearch'
// import goshuffle from './implementations/goshuffle'
// import goskip from './implementations/goskip'
// import gostop from './implementations/gostop'
import { GolemCommand } from '.'

export const Commands = new Collection<string, GolemCommand<any>>()

export const RegisteredCommands = {
  // goadmin,
  // goalias,
  // goget,
  // gomix,
  // gopause,
  // gopeek,
  // gopermission,
  goplay,
  // goplaylist,
  // goplaynext,
  // goreport,
  gosearch,
  // goshuffle,
  // goskip,
  // gostop,
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
