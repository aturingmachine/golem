import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository } from 'typeorm'
import { GolemMessage } from '../../messages/golem-message'
import { LoggerService } from '../logger/logger.service'
import { Permissions } from './permissions'

@Injectable()
export class PermissionsService {
  constructor(
    private log: LoggerService,

    @InjectRepository(Permissions)
    private permissions: MongoRepository<Permissions>
  ) {
    this.log.setContext('PermissionsService')
  }

  async for(message: GolemMessage): Promise<Permissions> {
    let rec = await this.permissions.findOneBy({
      userId: message.info.userId,
      guildId: message.info.guildId,
    })

    if (rec) {
      return rec
    }

    this.log.info(
      `database miss for user: ${message.info.userId} on guild ${message.info.guildId}`
    )
    this.log.info(`creating new base permissions record`)

    // Theres no record for that user on that guild
    // So we'll make a new base record.
    rec = Permissions.baseRecord(message.info)

    await this.permissions.save(rec)

    return rec
  }
}
