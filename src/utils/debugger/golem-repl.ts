import REPL from 'programmatic-repl'
import { CustomAlias } from '../../aliases/custom-alias'
import { PlayRecord } from '../../analytics/models/play-record'
import { Golem } from '../../golem'
import { LocalListing } from '../../listing/listing'
import { StringUtils } from '../string-utils'

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
          root: Golem.db,
          listings: LocalListing,
          // analytics: BotInteractionData,
          plays: PlayRecord,
          alias: CustomAlias,
        },
        StringUtils: StringUtils,
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
