import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository } from 'typeorm'
import { ParsedCommand } from '../../messages/parsed-command'
import { formatForLog } from '../../utils/debug-utils'
import { LoggerService } from '../logger/logger.service'
import { CustomAlias } from './alias.model'

interface CustomAliasHit {
  index: number
  // divider:
  alias: CustomAlias
}

@Injectable()
export class AliasService {
  constructor(
    private log: LoggerService,

    @InjectRepository(CustomAlias)
    private aliases: MongoRepository<CustomAlias>
  ) {
    this.log.setContext('AliasService')
  }

  async create(
    authorId: string,
    guildId: string,
    _source: ParsedCommand
  ): Promise<number | CustomAlias> {
    try {
      const name = _source.source.split('=>')[0].trim().split(' ').pop()
      const source = _source.source.split('=>')[1].trim()
      const desc: string | undefined =
        _source.extendedArgs.description?.toString()

      const existing = await this.forGuild(guildId)

      if (!name) {
        return 3
      }

      if (existing.map((a) => a.name).includes(name)) {
        return 2
      }

      this.log.debug(
        `creating alias "${name}" ${formatForLog({
          authorId,
          guildId,
          name,
          source,
          description: desc,
        })}`
      )

      const newAlias = this.aliases.create({
        authorId,
        guildId,
        name,
        source,
        description: desc,
      })

      this.aliases.save(newAlias)

      return newAlias
    } catch (error) {
      this.log.error(`error creating alias`, error)
      return 1
    }
  }

  forGuild(guildId: string): Promise<CustomAlias[]> {
    return this.aliases.find({ where: { guildId } })
  }

  async listForGuild(guildId: string): Promise<string> {
    const guildAliases = await this.forGuild(guildId)

    return guildAliases.reduce((prev, curr, index) => {
      return prev.concat(`${index + 1}: ${curr}`)
    }, '')
  }

  async hasCustomAlias(guildId: string, source: string): Promise<boolean> {
    const splits = source.split(/[;(&&)]/i)

    const guildAliases = await this.forGuild(guildId)

    return guildAliases.some((alias) => {
      return splits.some((split) => {
        split.startsWith(`$${alias.name}`)
      })
    })
  }

  /**
   * Should find the indexes of custom aliases in a string
   * containing a potential list of Command Blocks.
   */
  async findAliases(
    guildId: string,
    source: string
  ): Promise<CustomAliasHit[] | undefined> {
    // Individual Blocks
    const blocks = source.split(/;|(?:&&)/i)

    const guildAliases = await this.aliases.find({ where: { guildId } })

    // If the guild has no aliases lets save some time
    if (!guildAliases.length) {
      return undefined
    }

    const hits: CustomAliasHit[] = []

    blocks.forEach((block, index) => {
      console.log(`Checking block "${block}" for alias hits`)
      const match = guildAliases.find((alias) => {
        console.log(
          `Checking alias "${formatForLog(alias)}" [block.startsWith(${
            alias.name
          })] ? ${block.startsWith('$' + alias.name)}`
        )
        return block.startsWith(`$${alias.name}`)
      })

      // If we got a match, push its info into hits
      if (match) {
        hits.push({
          index,
          alias: match,
        })
      }
    })

    return hits.length ? hits : []
  }

  /**
   * Take a source string and inject hits at their respective
   * indexes.
   * @param source
   * @param hits
   */
  injectHits(source: string, hits: CustomAliasHit[]): string {
    const dividers = Array.from(source.matchAll(/;|(?:&&)/gi))

    return hits
      .map((hit) => {
        this.log.debug(`injecting ${hit.alias.source}`)
        return `${hit.alias.source} ${dividers.shift()?.[0] || ''}`
      })
      .join(' ')
  }
}
