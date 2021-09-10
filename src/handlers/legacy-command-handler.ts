import { Message, MessageEmbed } from 'discord.js'
import { RegisteredCommands } from '../commands'
import { logger } from '../utils/logger'

export class LegacyCommandHandler {
  static async parseMessage(msg: Message): Promise<void> {
    const subcommand = msg.content.split(' ')[1]

    if (!subcommand) {
      return
    }

    const args = msg.content.split(' ').slice(2).join(' ')

    logger.info(`Legacy Handler subcommand=${subcommand}, args="${args}"`)

    await LegacyCommandHandler.executeCommand(subcommand, args, msg)
  }

  static async executeCommand(
    subcommand: string,
    args: string,
    msg: Message
  ): Promise<void> {
    switch (subcommand) {
      case 'help':
        await msg.reply({ embeds: [LegacyCommandHandler.helpMsg] })
        break
      case 'play':
        await RegisteredCommands.goPlay.execute(msg, args)
        break
      case 'get':
        await RegisteredCommands.goGet.execute(msg, args)
        break
      case 'skip':
        await RegisteredCommands.goSkip.execute(msg)
        break
      case 'clear':
        await RegisteredCommands.goClear.execute(msg)
        break
      case 'pause':
        await RegisteredCommands.goPause.execute(msg)
        break
      case 'search':
        await RegisteredCommands.goSearch.execute(
          msg,
          args.split('-c')[0],
          args.split('-c')[1] ? parseInt(args.split('-c')[1], 10) : undefined
        )
        break
      case 'peek':
        await RegisteredCommands.goPeek.execute(msg)
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
          name: 'clear',
          value: 'clear the current queue',
          inline: true,
        },
        {
          name: 'skip',
          value: 'skip the current track',
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
        }
      )
      .setFooter('Commands also available via /go<command>')
  }
}
