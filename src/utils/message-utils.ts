import {
  EmbedFieldData,
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
import { MusicPlayer } from '../player/beta-music-player'
import { Plex } from '../plex'
import { Track } from '~/models/track'
import { GolemLogger } from './logger'
import { humanReadableDuration } from './time-utils'

const embedFieldSpacer = {
  name: '\u200B',
  value: '\u200B',
  inline: true,
}

export const GetMessageAttachement = (albumArt?: Buffer): MessageAttachment => {
  return new MessageAttachment(albumArt || PlexLogo, 'cover.png')
}

export const GetEmbedFromListing = async (
  track: Track,
  player: MusicPlayer
): Promise<{ embed: MessageEmbed; image: MessageAttachment }> => {
  const color = await getAverageColor(track.listing.albumArt || PlexLogo, {
    algorithm: 'dominant',
  })
  const image = GetMessageAttachement(track.listing.albumArt)

  const embed = new MessageEmbed()
    .setTitle(player.isPlaying ? 'Added to Queue' : 'Now Playing')
    .setDescription(
      player.isPlaying ? `Starts In: ${player.stats.hTime}` : 'Starting Now'
    )
    .setColor(color.hex)
    .setThumbnail(`attachment://cover.png`)
    .setFields(
      {
        name: 'Artist',
        value: track.listing.artist,
      },
      {
        name: 'Album',
        value: track.listing.album,
        inline: true,
      },
      embedFieldSpacer,
      {
        name: 'Duration',
        value: `${
          track.listing.hasDefaultDuration
            ? '-'
            : humanReadableDuration(track.listing.duration)
        }`,
        inline: true,
      },
      {
        name: 'Track',
        value: track.listing.title,
        inline: true,
      },
      embedFieldSpacer,
      {
        name: 'Genres',
        value: track.listing.genres.length
          ? track.listing.genres.slice(0, 3).join(', ')
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
  const color = await getAverageColor(albumArt || PlexLogo, {
    algorithm: 'dominant',
  })

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
  results: Track[],
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
  results: Track[]
): MessageOptions => {
  GolemLogger.debug(
    `creating wide search embed: ${query}, ${results.length} hits`
  )
  const options: MessageSelectOptionData[] = results.slice(0, 25).map((r) => {
    return {
      label: r.shortName,
      value: r.listing.id,
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
