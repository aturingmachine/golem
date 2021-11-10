import REPL from 'programmatic-repl'
import { BotInteractionData } from '../../analytics/models/interaction'
import { PlayRecordData } from '../../analytics/models/play-record'
import { Golem } from '../../golem'
import { LibIndexData } from '../../models/db/lib-index'
import { ListingData } from '../../models/db/listing'

export class GolemRepl {
  static completions = [
    'bot',
    'bot.internal',
    'bot.golem',
    'bot.golem.trackFinder',
    'bot.golem.trackFinder.search',
    'bot.golem.trackFinder.searchMany',
    'db.listings.find',
    'db.listings.findOne',
    'db.libs.find',
    'db.libs.findOne',
    'db.analytics.find',
    'db.analytics.findOne',
    'db.plays.find',
    'db.plays.findOne',
  ]

  repl: REPL

  constructor() {
    this.repl = new REPL(
      {
        includeBuiltinLibs: false,
        includeNative: false,
        name: 'golem-debug',
      },
      {
        bot: {
          internal: this,
          golem: Golem,
          search: Golem.trackFinder,
        },
        db: {
          listings: ListingData,
          libs: LibIndexData,
          analytics: BotInteractionData,
          plays: PlayRecordData,
        },
      }
    )
  }

  async execute(cmd: string): Promise<void> {
    try {
      const result = await this.repl.execute(cmd)

      console.log(this.clearProps(result))
    } catch (error) {
      console.error(error)
    }
  }

  private clearProps(obj: any): any {
    if (!obj) {
      return obj
    }

    Object.keys(obj).forEach((key) => {
      if (key === 'albumArt') {
        obj.albumArt = 'OMITTED'
        return
      } else if (typeof obj[key] !== 'object') {
        return
      }

      return this.clearProps(obj[key])
    })

    return obj
  }
}
