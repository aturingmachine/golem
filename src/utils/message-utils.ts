import {
  EmbedFieldData,
  GuildMember,
  Interaction,
  Message,
  MessageAttachment,
  MessageEmbed,
  MessageOptions,
} from 'discord.js'
import { getAverageColor } from 'fast-average-color-node'
import { GolemConf } from '../config'
import { Constants, PlexLogo } from '../constants'
import { LocalListing } from '../listing/listing'
import { MusicPlayer } from '../player/music-player'

export const embedFieldSpacer = {
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

export const getDurationBar = (current: number, total: number): string => {
  const barWidth = 20
  const ratio = (total - current) / total
  return `${''
    .padEnd(Math.round(barWidth * ratio), '\u2588')
    .padEnd(barWidth, '-')}`
}

export const centerString = (longest: number, str: string): string => {
  return str.padStart((longest - str.length) / 2 + str.length).padEnd(longest)
}

export const getSearchReply = (
  query: string,
  results: LocalListing[],
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
