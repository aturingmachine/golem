import {
  MessageSelectOptionData,
  MessageActionRow,
  MessageOptions,
  SelectMenuInteraction,
} from 'discord.js'
import { MessageComponentTypes } from 'discord.js/typings/enums'
import { CommandBase } from '../../constants'
import { Golem } from '../../golem'
import { SelectMenuId } from '../../handlers/button-handler'
import { LocalTrack } from '../../tracks/track'
import { GolemLogger, LogSources } from '../../utils/logger'
import { GolemMessage } from '../message-wrapper'
import { SelectMenu } from '../select-menu'
import { ListingEmbed } from './listing-embed'

export class WideSearch {
  private static log = GolemLogger.child({ src: LogSources.WideSearch })

  public options: MessageOptions

  constructor(public interaction: GolemMessage) {
    const query = interaction.parsed.getDefault('query', '')
    const results = Golem.trackFinder.searchMany(query)

    const options: MessageSelectOptionData[] = results.slice(0, 25).map((r) => {
      return {
        label: r.shortName,
        value: r.id,
      }
    })

    const menu = new SelectMenu({
      customId: {
        type: SelectMenuId.WideSearch,
        command: CommandBase.play,
        args: {
          query,
        },
      },
      options,
      placeholder: 'Select A Track',
    })

    const row = new MessageActionRow().addComponents(menu.toComponent())

    this.options = {
      content: `Found ${results.length} results for ${query}. Please select a track!`,
      components: [row],
    }
  }

  async send(): Promise<void> {
    await this.interaction.reply(this.options)
  }

  async collectResponse(): Promise<void> {
    if (this.interaction.lastReply) {
      await this.interaction.collector(
        {
          componentType: MessageComponentTypes.SELECT_MENU,
          time: 30_000,
        },
        this.handler.bind(this)
      )
    }
  }

  private async handler(select: SelectMenuInteraction): Promise<void> {
    WideSearch.log.info('executing')

    if (!this.interaction.player) {
      await select.update({
        content: 'Not in a valid voice channel.',
        components: [],
      })
      return
    }

    const listingId = select.values[0]

    const listing = Golem.trackFinder.findListingsByIds([{ id: listingId }])[0]

    WideSearch.log.verbose(`Got ${listing.shortName} from id ${listingId}`)

    const listingEmbed = new ListingEmbed(this.interaction, listing)
    const messageOptions = await listingEmbed.messageOptions('queue')

    await select.update({
      ...messageOptions,
      components: [],
      flags: undefined,
    })

    await this.interaction.player.enqueue(
      new LocalTrack(listing, select.user.id)
    )
  }
}
