import { Message } from 'discord.js'
import { RegisteredCommands } from '../commands'
import { CommandNames } from '../constants'
import { GolemLogger, LogSources } from '../utils/logger'

export async function AliasedCommand(
  msg: Message,
  content: string
): Promise<boolean> {
  const command = content.split(' ').slice(0, 1).join(' ')
  const args = content.split(' ').slice(1).join(' ')

  switch (command) {
    case '$play':
      await RegisteredCommands.goPlay.execute(msg, args)
      break
    case '$playnext':
      await RegisteredCommands.goPlayNext.execute(msg, args)
      break
    case '$np':
    case '$nowplaying':
      await RegisteredCommands.goGet.execute(msg, 'np')
      break
    case '$stop':
      await RegisteredCommands.goStop.execute(msg)
      break
    case '$skip':
      await RegisteredCommands.goSkip.execute(msg, parseInt(args, 10))
      break
    case '$pause':
      await RegisteredCommands.goPause.execute(msg)
      break
    default:
      return false
  }
  return true
}

export class LegacyCommandHandler {
  static async parseMessage(
    msg: Message,
    overrideContent?: string
  ): Promise<void> {
    // Early exit on an aliased command

    console.log('legacy overide:', overrideContent)
    const content = overrideContent || msg.content
    console.log('legacy content', content)

    if (!content.startsWith('$go ') && content.startsWith('$')) {
      console.log('Running', content, 'as aliased command')
      const hasRun = await AliasedCommand(msg, content)
      if (hasRun) {
        return
      }
    }

    // Handle a $go style command
    const subcommand = content.split(' ')[1]

    if (!subcommand) {
      return
    }

    const args = content.split(' ').slice(2).join(' ')

    GolemLogger.debug(`subcommand=${subcommand}, args="${args}"`, {
      src: LogSources.LegacyHandler,
    })

    await LegacyCommandHandler.executeCommand(subcommand, args, msg)
  }

  static async executeCustomAlias(
    msg: Message,
    fullCommand: string
  ): Promise<void> {
    await LegacyCommandHandler.parseMessage(msg, fullCommand)
  }

  static async executeCommand(
    subcommand: string,
    args: string,
    msg: Message
  ): Promise<void> {
    switch (subcommand) {
      case CommandNames.help:
        await msg.reply(LegacyCommandHandler.helpMessage())
        break
      case CommandNames.play:
        await RegisteredCommands.goPlay.execute(msg, args)
        break
      case CommandNames.get:
        await RegisteredCommands.goGet.execute(msg, args)
        break
      case CommandNames.skip:
        await RegisteredCommands.goSkip.execute(
          msg,
          args.length ? parseInt(args, 10) : undefined
        )
        break
      case CommandNames.stop:
        await RegisteredCommands.goStop.execute(msg)
        break
      case CommandNames.pause:
        await RegisteredCommands.goPause.execute(msg)
        break
      case CommandNames.search:
        await RegisteredCommands.goSearch.execute(
          msg,
          args.split('-c')[0],
          args.split('-c')[1] ? parseInt(args.split('-c')[1], 10) : undefined
        )
        break
      case CommandNames.peek:
        await RegisteredCommands.goPeek.execute(msg)
        break
      case CommandNames.playlist:
      case 'playlists':
        await RegisteredCommands.goPlaylist.execute(msg, args)
        break
      case CommandNames.shuffle:
        await RegisteredCommands.goShuffle.execute(msg)
        break
      case CommandNames.mix:
        await RegisteredCommands.goMix.execute(
          msg,
          args.split(' ').slice(0, 1).join(''),
          args.split(' ').slice(1).join(' ')
        )
        break
      case CommandNames.alias:
        await RegisteredCommands.goAlias.execute(msg, args)
        break
      default:
        break
    }
  }

  private static helpMessage(): string {
    return Object.values(RegisteredCommands)
      .reduce((prev, curr) => {
        return prev.concat(curr.toString())
      }, '```')
      .concat('```')
  }
}
