import {
  EmbedFieldData,
  GuildMember,
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
import { Golem } from '../golem'
import { ButtonIdPrefixes } from '../handlers/button-handler'
import { Listing, TrackListingInfo } from '../models/listing'
import { MusicPlayer } from '../player/music-player'
import { GolemConf } from './config'
import { humanReadableDuration, humanReadableTime } from './time-utils'

const embedFieldSpacer = {
  name: '\u200B',
  value: '\u200B',
  inline: true,
}

export const averageColor = (img?: Buffer | string): any =>
  getAverageColor(img || PlexLogo, {
    algorithm: GolemConf.image.avgColorAlgorithm,
  })

export const memberFrom = (
  interaction: Message | Interaction
): GuildMember | null => interaction.member as GuildMember

export const userFrom = (interaction: Message | Interaction): string =>
  interaction.member?.user.id || ''

export const guildIdFrom = (interaction: Message | Interaction): string =>
  interaction.guild?.id || interaction.guildId || ''

export const GetMessageAttachement = (albumArt?: Buffer): MessageAttachment => {
  return new MessageAttachment(albumArt || PlexLogo, 'cover.png')
}

const getDurationBar = (current: number, total: number): string => {
  const barWidth = 20
  const ratio = (total - current) / total
  return `${''
    .padEnd(Math.round(barWidth * ratio), '\u2588')
    .padEnd(barWidth, '-')}`
}

export const GetEmbedFromListing = async (
  listing: TrackListingInfo,
  player: MusicPlayer,
  context: 'queue' | 'playing'
): Promise<{ embed: MessageEmbed; image?: MessageAttachment }> => {
  const isQueue = context === 'queue'
  const color = await averageColor(listing.albumArt)

  let image: MessageAttachment | undefined
  if (typeof listing.albumArt !== 'string') {
    image = GetMessageAttachement(listing.albumArt)
  }

  let title: string
  let description: string

  if (isQueue) {
    title = player.isPlaying ? 'Added to Queue' : 'Now Playing'
    description = player.isPlaying
      ? `Starts In: ${player.stats.hTime}`
      : 'Starting Now'
  } else {
    title = 'Now Playing'
    const timeRemaining = humanReadableTime(player.currentTrackRemaining)

    if (player.currentResource) {
      const durationBar = getDurationBar(
        player.currentTrackRemaining,
        player.currentResource.metadata.duration
      )
      description = `\`[${durationBar}] - ${timeRemaining}\``
    } else {
      description = `Remaining: ${timeRemaining}`
    }
  }

  const isLocalListing = listing instanceof Listing
  const duration = isLocalListing
    ? `${
        listing.hasDefaultDuration
          ? '-'
          : humanReadableDuration(listing.duration)
      }`
    : humanReadableDuration(listing.duration)

  const fields: EmbedFieldData[] = [
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
      value: duration,
      inline: true,
    },
    {
      name: 'Track',
      value: listing.title,
      inline: true,
    },
    embedFieldSpacer,
  ]

  if (isLocalListing) {
    fields.push({
      name: 'Genres',
      value: listing.genres.length
        ? listing.genres.slice(0, 3).join(', ')
        : 'N/A',
      inline: true,
    })
  }

  const embed = new MessageEmbed()
    .setTitle(title)
    .setDescription(description)
    .setColor(color.hex)
    .setThumbnail(
      typeof listing.albumArt !== 'string'
        ? `attachment://cover.png`
        : listing.albumArt || ''
    )
    .setFields(...fields)

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
    .setImage('attachment://cover.png')

  return {
    embeds: [embed],
    components: [row],
    files: image ? [image] : [],
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
  const options: MessageSelectOptionData[] = Golem.plex.playlists
    .slice(0, offset)
    .map((playlist) => ({
      label: `${playlist.name} - ${playlist.count} Tracks`,
      value: playlist.name,
    }))

  if (Golem.plex.playlists.length > 25) {
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
    content: `Found **${Golem.plex.playlists.length}** Playlists`,
    components: [row],
  }
}

export const GetPeekEmbed = (player: MusicPlayer): MessageEmbed => {
  const peekedTracks = player.peek()

  const fields = peekedTracks.map((track, index) => ({
    name: index === 0 ? 'Up Next' : `Position: ${index + 1}`,
    value: track.metadata.title,
  })) as EmbedFieldData[]

  return new MessageEmbed()
    .setTitle('Upcoming Tracks')
    .setDescription(`${player.trackCount} Queued Tracks`)
    .setFields(...fields)
}
