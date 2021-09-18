import {
  EmbedFieldData,
  Interaction,
  Message,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectOptionData,
} from 'discord.js'
import { getAverageColor } from 'fast-average-color-node'
import { Constants, PlexLogo } from '../constants'
import { ButtonIdPrefixes } from '../handlers/button-handler'
import { Listing } from '../models/listing'
import { MusicPlayer } from '../player/music-player'
import { Plex } from '../plex'
import { Config } from './config'
import { GolemLogger } from './logger'
import { humanReadableDuration, humanReadableTime } from './time-utils'

const embedFieldSpacer = {
  name: '\u200B',
  value: '\u200B',
  inline: true,
}

const averageColor = (img?: Buffer) =>
  getAverageColor(img || PlexLogo, {
    algorithm: Config.Image.ColorAlg,
  })

export const userFrom = (interaction: Message | Interaction): string =>
  interaction.member?.user.id || ''

export const GetMessageAttachement = (albumArt?: Buffer): MessageAttachment => {
  return new MessageAttachment(albumArt || PlexLogo, 'cover.png')
}

const getDurationBar = (current: number, total: number): string => {
  const ratio = (current - total) / total
  console.log('>>> current', current)
  console.log('>>> total', total)
  console.log('>>> ratio', ratio)
  console.log('>>> hash calced', Math.round(20 * ratio))
  return ''.padEnd(Math.round(20 * ratio), '#').padEnd(20, '-')
}

export const GetEmbedFromListing = async (
  listing: Listing,
  player: MusicPlayer,
  context: 'queue' | 'playing'
): Promise<{ embed: MessageEmbed; image: MessageAttachment }> => {
  const isQueue = context === 'queue'
  const color = await averageColor(listing.albumArt)
  const image = GetMessageAttachement(listing.albumArt)

  const title = isQueue
    ? player.isPlaying
      ? 'Added to Queue'
      : 'Now Playing'
    : 'Now Playing'

  const description = isQueue
    ? player.isPlaying
      ? `Starts In: ${player.stats.hTime}`
      : 'Starting Now'
    : player.currentResource
    ? `[${getDurationBar(
        player.currentTrackRemaining,
        player.currentResource.metadata.duration
      )}] - ${humanReadableTime(player.currentTrackRemaining)}`
    : `Remaining: ${humanReadableTime(player.currentTrackRemaining)}`

  const embed = new MessageEmbed()
    .setTitle(title)
    .setDescription(description)
    .setColor(color.hex)
    .setThumbnail(`attachment://cover.png`)
    .setFields(
      {
        name: 'Artist',
        value: listing.artist,
      },
      {
        name: 'Album',
        value: listing.album,
        inline: true,
      },
      embedFieldSpacer,
      {
        name: 'Duration',
        value: `${
          listing.hasDefaultDuration
            ? '-'
            : humanReadableDuration(listing.duration)
        }`,
        inline: true,
      },
      {
        name: 'Track',
        value: listing.title,
        inline: true,
      },
      embedFieldSpacer,
      {
        name: 'Genres',
        value: listing.genres.length
          ? listing.genres.slice(0, 3).join(', ')
          : 'N/A',
        inline: true,
      }
    )

  return {
    embed,
    image,
  }
}

export const ArtistConfirmButton = (artist: string): MessageActionRow => {
  return new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(`${ButtonIdPrefixes.confirmArtistPlay}${artist}`)
      .setLabel('Yes')
      .setStyle('SUCCESS'),
    new MessageButton()
      .setCustomId(`${ButtonIdPrefixes.shuffleArtistPlay}${artist}`)
      .setLabel('Shuffle')
      .setStyle('PRIMARY'),
    new MessageButton()
      .setCustomId(`${ButtonIdPrefixes.abortArtistPlay}${artist}`)
      .setLabel('No')
      .setStyle('DANGER')
  )
}

export const ArtistConfirmReply = async (
  artist: string,
  albumArt?: Buffer
): Promise<MessageOptions> => {
  const image = GetMessageAttachement(albumArt)
  const color = await averageColor(albumArt)

  const row = ArtistConfirmButton(artist)

  const embed = new MessageEmbed()
    .setTitle(`Play ${artist}?`)
    .setDescription(
      `Looks like you might be looking for the artist: **${artist}**.\nShould I queue their discography?`
    )
    .setColor(color.hex)
    .setThumbnail('attachment://cover.png')

  return {
    embeds: [embed],
    components: [row],
    files: [image],
  }
}

export const centerString = (longest: number, str: string): string => {
  return str.padStart((longest - str.length) / 2 + str.length).padEnd(longest)
}

export const getSearchReply = (
  query: string,
  results: Listing[],
  totalCount: number
): MessageOptions => {
  const fields: EmbedFieldData[] = results
    .map((res, index) => ({
      name: `Hit ${index + 1}`,
      value: res.longName,
      inline: true,
    }))
    .reduce((prev, curr, index) => {
      if (index && index % 2 === 0) {
        prev.push(embedFieldSpacer)
      }
      prev.push(curr)

      return prev
    }, [] as EmbedFieldData[])

  console.log(fields)

  const embed = new MessageEmbed()
    .setTitle(`Top ${results.length} for "${query.toUpperCase()}"`)
    .setDescription(`Taken from **${totalCount}** total results`)
    .setFields(...fields, embedFieldSpacer)
    .setColor(Constants.baseColor)

  return {
    embeds: [embed],
  }
}

export const GetWideSearchEmbed = (
  query: string,
  results: Listing[]
): MessageOptions => {
  GolemLogger.debug(
    `creating wide search embed: ${query}, ${results.length} hits`
  )
  console.log(results)
  const options: MessageSelectOptionData[] = results.slice(0, 25).map((r) => {
    return {
      label: r.shortName,
      value: r.id,
    }
  })

  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId(`${ButtonIdPrefixes.wideSearchPlay}${query}`)
      .setPlaceholder('Select a track')
      .addOptions(...options)
  )

  return {
    content: `Found ${results.length} results for ${query}. Please select a track!`,
    components: [row],
  }
}

export const GetPlaylistEmbed = (offset = 25): MessageOptions => {
  const options: MessageSelectOptionData[] = Plex.playlists
    .slice(0, offset)
    .map((playlist) => ({
      label: `${playlist.name} - ${playlist.count} Tracks`,
      value: playlist.name,
    }))

  if (Plex.playlists.length > 25) {
    options.pop()
    options.push({
      label: 'Load More...',
      value: `${ButtonIdPrefixes.playlistLoadMore}${offset + 1}`,
    })
  }

  const row = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId(`${ButtonIdPrefixes.playlistLoadMore}${offset + 1}`)
      .setPlaceholder('Select A Playlist')
      .addOptions(...options)
  )

  return {
    content: `Found **${Plex.playlists.length}** Playlists`,
    components: [row],
  }
}

export const GetPeekEmbed = (player: MusicPlayer): MessageEmbed => {
  const peekedTracks = player.peek()

  const fields = peekedTracks.map((track, index) => ({
    name: index === 0 ? 'Up Next' : `Position: ${index + 1}`,
    value: track.listing.longName,
  })) as EmbedFieldData[]

  return new MessageEmbed()
    .setTitle('Upcoming Tracks')
    .setDescription(`${player.trackCount} Queued Tracks`)
    .setFields(...fields)
}
