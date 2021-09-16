import fs from 'fs'
import path from 'path'
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
import { Constants } from '../constants'
import { ButtonIdPrefixes } from '../handlers/button-handler'
import { Listing } from '../models/listing'
import { Player } from '../player/music-player'
import { Plex } from '../plex'
import { Track } from '~/models/track'
import { humanReadableDuration } from './time-utils'

const embedFieldSpacer = {
  name: '\u200B',
  value: '\u200B',
  inline: true,
}

export const GetMessageAttachement = (albumArt?: Buffer): MessageAttachment => {
  return new MessageAttachment(
    albumArt || fs.readFileSync(path.resolve(__dirname, '../../plexlogo.jpg')),
    'cover.png'
  )
}

export const GetEmbedFromListing = (
  listing: Listing,
  isQueued: boolean
): { embed: MessageEmbed; image: MessageAttachment } => {
  const image = GetMessageAttachement(listing.albumArt)

  const embed = new MessageEmbed()
    .setTitle(isQueued ? 'Added to Queue' : 'Now Playing')
    .setDescription(
      isQueued ? `Starts In: ${Player.stats.hTime}` : 'Starting Now'
    )
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
        value: listing.genres.slice(0, 3).join(', '),
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

export const ArtistConfirmReply = (
  artist: string,
  albumArt?: Buffer
): MessageOptions => {
  const image = GetMessageAttachement(albumArt)

  const row = ArtistConfirmButton(artist)

  const embed = new MessageEmbed()
    .setTitle(`Play ${artist}?`)
    .setDescription(
      `Looks like you might be looking for the artist: **${artist}**.\nShould I queue their discography?`
    )
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
      value: new Listing(res).names.short.piped,
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
