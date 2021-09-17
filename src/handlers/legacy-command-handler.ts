import { Message, MessageEmbed } from 'discord.js'
import { RegisteredCommands } from '../commands'
import { CommandNames } from '../constants'
import { GolemLogger, LogSources } from '../utils/logger'

export class LegacyCommandHandler {
  static async parseMessage(msg: Message): Promise<void> {
    // Early exit on a $play
    if (msg.content.startsWith('$play')) {
      await RegisteredCommands.goPlay.execute(
        msg,
        msg.content.split(' ').slice(1).join(' ')
      )
      return
    }

    const subcommand = msg.content.split(' ')[1]

    if (!subcommand) {
      return
    }

    const args = msg.content.split(' ').slice(2).join(' ')

    GolemLogger.info(`subcommand=${subcommand}, args="${args}"`, {
      src: LogSources.LegacyHandler,
    })

    await LegacyCommandHandler.executeCommand(subcommand, args, msg)
  }

  static async executeCommand(
    subcommand: string,
    args: string,
    msg: Message
  ): Promise<void> {
    switch (subcommand) {
      case CommandNames.help:
        await msg.reply({ embeds: [LegacyCommandHandler.helpMsg] })
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
      default:
        break
    }
  }

  private static get helpMsg(): MessageEmbed {
    return new MessageEmbed()
      .setColor('#f900d5')
      .setTitle('Golem - Help')
      .setDescription('`$go <command>`')
      .addFields(
        {
          name: 'get [stat]',
          value: `\`time\`: estimated queue time
       \`count\`: current queue count
       \`np | nowplaying\`: current playing track
       \`tcount\`: library size
       \`playlist[s]\`: list all playlists
       returns all stats if invoked with no parameters`,
          inline: true,
        },
        {
          name: 'play [query]',
          value:
            'search for [query] and play top hit or look for further input\n no [query] will resume playback of a paused track',
          inline: true,
        },
        {
          name: 'pause',
          value: 'pause the currently playing track',
          inline: true,
        },
        {
          name: 'stop',
          value: 'stop playback and clear the queue',
          inline: true,
        },
        {
          name: 'skip [count]',
          value: 'skip the current track, or [count] tracks',
          inline: true,
        },
        {
          name: 'peek',
          value: 'see the next 5 queued tracks',
          inline: true,
        },
        {
          name: 'search -c [count]',
          value: 'search for up [count] tracks, max 10, default 5',
          inline: true,
        },
        {
          name: 'playlist[s] [playlist-name]',
          value: 'queue playlist [playlist-name] or choose from a menu',
          inline: true,
        },
        {
          name: 'shuffle',
          value: 'shuffle the queue',
          inline: true,
        }
      )
      .setFooter('Commands also available via /go<command>')
  }
}
