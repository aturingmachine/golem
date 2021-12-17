import { MessageEmbed, MessageOptions } from 'discord.js'
import { Commands } from '../commands/register-commands'
import { Golem } from '../golem'
import { MusicPlayer } from '../player/music-player'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'

export interface GetOptions {
  value: string | null
  guildId: string | null
}

const noPlayerMsg = 'Unable to find player.'

/**
 * @todo this whole class needs to be reworked to use the new message
 * wrapper. it is still using the old string manipulation everywhere...
 */
export class GoGet {
  async it(opts: Partial<GetOptions>): Promise<MessageOptions> {
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
        return await this.npResponse(Golem.getPlayer(opts.guildId || ''))
      case 'tcount':
        return { content: this.tCountResponse }
      // case 'catalog':
      //   return this.catalog
      case 'playlist':
      case 'playlists':
        return { content: this.playlists }
      case 'help':
        return { content: this.helpMessage }
      default:
        return await this.stats(Golem.getPlayer(opts.guildId || ''))
    }
  }

  timeResponse(player?: MusicPlayer): string {
    return `\n**Est. Queue Time**: ${player?.stats.hTime || noPlayerMsg}`
  }

  qCountResponse(player?: MusicPlayer): string {
    return `\n**Queued Tracks**: ${player?.stats.count || noPlayerMsg}`
  }

  async npResponse(player?: MusicPlayer): Promise<MessageOptions> {
    if (player && player.currentResource && player.nowPlaying) {
      const assets = await GetEmbedFromListing(
        player.nowPlaying,
        player,
        'playing'
      )

      return {
        embeds: [assets.embed],
        files: assets.image ? [assets.image] : [],
      }
    } else {
      const embed = new MessageEmbed()
        .setTitle('Now Playing')
        .setDescription(
          'No Track is currently playing... Use `$play` to play a track!'
        )
      return {
        embeds: [embed],
      }
    }
  }

  get tCountResponse(): string {
    return `\n**Available Tracks**: ${Golem.trackFinder.trackCount}`
  }

  async stats(player?: MusicPlayer): Promise<MessageOptions> {
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

    const np = await this.npResponse(player)

    np.embeds?.[0].fields?.push(...fields)

    return {
      embeds: np.embeds || [],
      files: np.files || [],
    }
  }

  // get catalog(): string {
  //   let longest = 0
  //   const artistCounts = TrackFinder.listings
  //     .map((listing) =>
  //       listing.artist.length < 20
  //         ? listing.artist
  //         : listing.artist.concat('...')
  //     )
  //     .reduce((prev, curr) => {
  //       longest = curr?.length > longest ? curr?.length : longest
  //       if (prev[curr] !== undefined) {
  //         prev[curr] = prev[curr] + 1
  //       } else {
  //         prev[curr] = 1
  //       }

  //       return prev
  //     }, {} as Record<string, number>)

  //   const catalog = Object.entries(artistCounts).reduce((prev, curr, index) => {
  //     const label = curr.join(': ')
  //     if (index % 3) {
  //       return prev.concat(`\n\r${centerString(longest, label)}`)
  //     } else {
  //       return prev.concat(`${centerString(longest, label)}`)
  //     }
  //   }, '')

  //   return catalog
  // }

  get playlists(): string {
    return Golem.plex.playlists.reduce((prev, curr) => {
      return prev.concat(`\n${curr.name} - _${curr.count} tracks_`)
    }, '**Playlists:**')
  }

  private get helpMessage(): string {
    let helpMsg = ''

    const builtInCommandsHelp = Array.from(Commands.values()).reduce(
      (prev, curr) => {
        return prev.concat(curr.toString())
      },
      '```'
    )

    helpMsg = helpMsg.concat(builtInCommandsHelp)

    return helpMsg.concat('```')
  }
}

// longest => 10
// 'hello' => 5
// padStart((longest - str.length) / 2 + str.length)
