import fs from 'fs'
import {
  CommandInteraction,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  MessageEmbed,
  MessageOptions,
} from 'discord.js'
import { ButtonIdPrefixes } from '../handlers/button-handler'
import { Listing } from '../models/listing'
import { Player } from '../voice/voice-handler'
import { humanReadableDuration } from './time-utils'

export const GetMessageAttachement = (albumArt?: Buffer): MessageAttachment => {
  return new MessageAttachment(
    albumArt || fs.readFileSync('../../plexlogo.png'),
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
        value: listing.track,
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

  const row = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId(`${ButtonIdPrefixes.confirmArtistPlay}${artist}`)
      .setLabel('Yes')
      .setStyle('SUCCESS'),
    new MessageButton()
      .setCustomId(`${ButtonIdPrefixes.abortArtistPlay}${artist}`)
      .setLabel('No')
      .setStyle('DANGER')
  )

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
