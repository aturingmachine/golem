import { MessageOptions } from 'discord.js'
import { Commands } from '../commands/register-commands'
import { Golem } from '../golem'
import { GolemMessage, GolemMessageOpts } from '../messages/message-wrapper'
import { ListingEmbed } from '../messages/replies/listing-embed'
import { MusicPlayer } from '../music/player/music-player'
import { GolemLogger, LogSources } from '../utils/logger'

export interface GetOptions {
  value: string | null
  guildId: string | null
  message: GolemMessage
}

const noPlayerMsg = 'Unable to find player.'

export class GoGet {
  async it(opts: GetOptions): Promise<MessageOptions> {
    GolemLogger.verbose(`Go Getting With ${opts.value} ${opts.guildId}`, {
      src: LogSources.GoGetHandler,
    })

    switch (opts.value?.toLowerCase()) {
      case 'time':
        return {
          content: this.timeResponse(Golem.getPlayer(opts.guildId || '')),
        }
      case 'count':
        return {
          content: this.qCountResponse(Golem.getPlayer(opts.guildId || '')),
        }
      case 'np':
      case 'nowplaying':
        return (await this.npResponse(opts.message)).asMessage()
      case 'tcount':
        return { content: this.tCountResponse }
      case 'playlist':
      case 'playlists':
        return { content: this.playlists }
      case 'help':
        return { content: this.helpMessage }
      default:
        return await this.stats(opts.message)
    }
  }

  timeResponse(player?: MusicPlayer): string {
    return `\n**Est. Queue Time**: ${player?.stats.hTime || noPlayerMsg}`
  }

  qCountResponse(player?: MusicPlayer): string {
    return `\n**Queued Tracks**: ${player?.stats.count || noPlayerMsg}`
  }

  async npResponse(message: GolemMessage): Promise<GolemMessageOpts> {
    const listingEmbed = new ListingEmbed(message)
    return listingEmbed.messageOptions('play')
  }

  get tCountResponse(): string {
    return `\n**Available Tracks**: ${Golem.trackFinder.trackCount}`
  }

  async stats(message: GolemMessage): Promise<MessageOptions> {
    const player = message.player
    const fields = [
      {
        name: 'Available Tracks',
        value: Golem.trackFinder.trackCount.toString(),
        inline: true,
      },
    ]

    if (player) {
      fields.push(
        { name: 'Est. Queue Time', value: player.stats.hTime, inline: true },
        {
          name: 'Queued Tracks',
          value: player.stats.count.toString(),
          inline: true,
        }
      )
    }

    const np = (await this.npResponse(message)).asObject()

    np.embeds?.[0].fields?.push(...fields)

    return {
      embeds: np.embeds || [],
      files: np.files || [],
    }
  }

  get playlists(): string {
    return Golem.plex.playlists.reduce((prev, curr) => {
      return prev.concat(`\n${curr.name} - _${curr.count} tracks_`)
    }, '**Playlists:**')
  }

  private get helpMessage(): string {
    let helpMsg = 'Get help for any command via: `$go <command> --help`\n'

    const builtInCommandsHelp = Array.from(Commands.values()).reduce(
      (prev, curr) => {
        return prev.concat(curr.toString())
      },
      '```'
    )

    helpMsg = helpMsg.concat(builtInCommandsHelp)

    return helpMsg.concat(
      '```\nFind more info at https://aturingmachine.github.io/golem/'
    )
  }
}
