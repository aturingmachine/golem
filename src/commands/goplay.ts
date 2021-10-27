import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { Analytics } from '../analytics'
import { CommandAnalyticsInteraction } from '../analytics/models/interaction'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command, CommandHelp } from '../models/commands'
import { fourSquare } from '../utils/image-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import {
  ArtistConfirmReply,
  GetEmbedFromListing,
  GetWideSearchEmbed,
} from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoPlay })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.play)
  .setDescription('Play Something')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('query for a track')
      .setRequired(true)
  )

const execute = async (
  interaction: CommandInteraction | Message,
  query?: string
): Promise<void> => {
  const player = Golem.getOrCreatePlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  let commandQuery = query

  const isSlashCommand = interaction instanceof CommandInteraction

  if (isSlashCommand) {
    commandQuery = interaction.options.getString('query') || ''
  }

  if (interaction.member) {
    Analytics.push(
      new CommandAnalyticsInteraction(interaction, {
        command: 'GoPlay',
        content: commandQuery,
      })
    )
  }

  if (!commandQuery) {
    player.unpause()
  } else {
    const res = Golem.trackFinder.search(commandQuery)

    if (!res) {
      log.debug(`GoPlay: No ResultSet`)
      await interaction.reply(`No Results for **${query}**`)
      return
    }

    log.debug(`Query Result: \n${res.listing.debugString}`)

    // Handle artist query
    if (res.isArtistQuery) {
      const srcs = Golem.trackFinder.artistSample(res.listing.artist, 4)

      await interaction.reply(
        await ArtistConfirmReply(
          res.listing.artist,
          await fourSquare({
            images: {
              img1: srcs[0].albumArt,
              img2: srcs[1].albumArt,
              img3: srcs[2].albumArt,
              img4: srcs[3].albumArt,
            },
          })
        )
      )
    }
    // Handle Wide Queries
    else if (res.isWideMatch) {
      await interaction.reply(
        GetWideSearchEmbed(
          commandQuery,
          Golem.trackFinder.searchMany(commandQuery)
        )
      )
    }
    // Handle Catch-All queries
    else {
      const { image, embed } = await GetEmbedFromListing(
        res.listing,
        player,
        'queue'
      )

      await interaction.reply({
        embeds: [embed],
        files: [image],
      })

      log.debug('GoPlay starting Player.')

      player.enqueue(interaction.member?.user.id || '', res.listing)
    }
  }
}

const helpInfo: CommandHelp = {
  name: 'stop',
  msg: 'Search for and play a track.',
  args: [
    {
      name: 'query',
      type: 'string',
      required: true,
      description: 'The track to search for and play.',
    },
  ],
  alias: '$play',
}

const goPlayCommand = new Command({
  source: LogSources.GoPlay,
  data,
  handler: execute,
  helpInfo,
})

export default goPlayCommand
