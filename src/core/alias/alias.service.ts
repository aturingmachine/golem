import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository } from 'typeorm'
import { BadArgsError } from '../../errors/bad-args-error'
import { BasicError } from '../../errors/basic-error'
import { ExistingResourceError } from '../../errors/existing-resource-error'
import { NoPrivilegesError } from '../../errors/no-privileges-error'
import { NotFoundError } from '../../errors/not-found-error'
import { NotOwnedError } from '../../errors/not-owner-error'
import { ParsedCommand } from '../../messages/parsed-command'
import { formatForLog } from '../../utils/debug-utils'
import { LoggerService } from '../logger/logger.service'
import { PermissionCode } from '../permissions/permissions'
import { PermissionsService } from '../permissions/permissions.service'
import { CustomAlias } from './alias.model'

interface CustomAliasHit {
  index: number
  alias: CustomAlias
}

@Injectable()
export class AliasService {
  constructor(
    private log: LoggerService,
    private permissionsService: PermissionsService,

    @InjectRepository(CustomAlias)
    private aliases: MongoRepository<CustomAlias>
  ) {
    this.log.setContext('AliasService')
  }

  async delete(query: {
    userId: string
    guildId: string
    aliasName: string
  }): Promise<void> {
    const isAdmin = await this.permissionsService.isAdmin(query)

    const canDelete = await this.permissionsService.can(
      {
        userId: query.userId,
        guildId: query.guildId,
      },
      [PermissionCode.AliasDelete]
    )

    this.log.debug(
      `Attemping to delete with lookup ${formatForLog(
        query
      )}; resolved permissions isAdmin=${isAdmin} canDelete=${canDelete}`
    )

    if (!canDelete) {
      throw new NoPrivilegesError({
        message: 'Cannot Delete Alias. Permission Denied.',
        required: [PermissionCode.AliasDelete],
        sourceAction: 'delete',
        sourceCmd: 'alias',
      })
    }

    const records = await this.aliases.findBy({
      authorId: query.userId,
      guildId: query.guildId,
      name: query.aliasName,
    })

    if (!records.length) {
      throw new NotFoundError({
        identifier: query.aliasName,
        message: `Alias named ${query.aliasName} not found on server ${query.guildId}.`,
        resource: 'alias',
        sourceCmd: 'delete',
      })
    }

    if (records[0].authorId !== query.userId && !isAdmin) {
      throw new NotOwnedError({
        message: 'Cannot Delete Alias. Permission Denied.',
        sourceAction: 'delete',
        sourceCmd: 'alias',
        resource: 'alias',
      })
    }

    try {
      const result = await this.aliases.deleteOne(records[0])

      if (!result.deletedCount) {
        throw new BasicError({
          message: 'Could not delete alias.',
          sourceCmd: 'alias',
          code: 100,
        })
      }
    } catch (error) {
      this.log.error('could not delete alias', error)
      throw error
    }
  }

  async create(
    authorId: string,
    guildId: string,
    _source: ParsedCommand
  ): Promise<CustomAlias> {
    try {
      const name = _source.source.split('=>')[0].trim().split(' ').pop()
      const source = _source.source.split('=>')[1].trim()
      const desc: string | undefined =
        _source.extendedArgs.description?.toString()

      const existing = await this.forGuild(guildId)

      if (!source) {
        throw new BadArgsError({
          message: 'Missing argument for Alias Value.',
          sourceCmd: 'alias.create',
          subcommand: 'create',
          argName: 'alias value',
          format: '$go alias create <alias name> => <alias value>',
        })
      }

      if (!name) {
        throw new BadArgsError({
          message: 'Missing argument for Alias Name.',
          sourceCmd: 'alias.create',
          subcommand: 'create',
          argName: 'alias name',
          format: '$go alias create <alias name> => <alias value>',
        })
      }

      if (existing.map((a) => a.name).includes(name)) {
        throw new ExistingResourceError({
          message: 'Missing argument for Alias Name.',
          sourceCmd: 'alias',
          identifier: name,
          resource: 'alias',
        })
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

      return this.aliases.save(newAlias)
    } catch (error) {
      this.log.error(`error creating alias`, error)
      throw error
    }
  }

  forGuild(guildId: string): Promise<CustomAlias[]> {
    return this.aliases.find({ where: { guildId } })
  }

  async listForGuild(guildId: string): Promise<string> {
    const guildAliases = await this.forGuild(guildId)

    return guildAliases
      .map((alias, index) => {
        const desc = alias.description ? `\n\t"${alias.description}"` : ''
        return `${index + 1}: ${alias.name} - ${alias.source}${desc}`
      })
      .join('\n')
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
      this.log.debug(`Checking block "${block}" for alias hits`)
      const match = guildAliases.find((alias) => {
        const testBlockFormat = block.trim() + ' '
        this.log.debug(
          `Checking alias "${formatForLog(alias)}" [block.startsWith(${
            alias.name
          })] ? ${testBlockFormat.startsWith('$' + alias.name)}`
        )
        return testBlockFormat.startsWith(`$${alias.name} `)
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
    const splitSource = source.split(/;|(?:&&)/gi)

    return splitSource
      .map((seg, index) => {
        const hit = hits.find((hit) => hit.index === index)
        // If a hit is at this index, inject it
        if (hit) {
          return `${seg.replace('$' + hit.alias.name, hit.alias.source)} ${
            dividers.shift()?.[0] || ''
          }`
        }

        return seg
      })
      .join(' ')
  }
}
