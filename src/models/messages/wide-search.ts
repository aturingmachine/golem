import {
  MessageSelectOptionData,
  MessageActionRow,
  MessageSelectMenu,
  MessageOptions,
} from 'discord.js'
import { Golem } from '../../golem'
import { ButtonIdPrefixes } from '../../handlers/button-handler'

export class WideSearch {
  public options: MessageOptions

  constructor(query: string) {
    const results = Golem.trackFinder.searchMany(query)

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

    this.options = {
      content: `Found ${results.length} results for ${query}. Please select a track!`,
      components: [row],
    }
  }
}
