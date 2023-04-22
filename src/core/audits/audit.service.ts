import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository } from 'typeorm'
import { GolemMessage } from '../../messages/golem-message'
import { LoggerService } from '../logger/logger.service'
import { AuditRecord } from './audit.model'

@Injectable()
export class AuditService {
  constructor(
    private log: LoggerService,

    @InjectRepository(AuditRecord)
    private audits: MongoRepository<AuditRecord>
  ) {
    this.log.setContext('AuditService')
  }

  async forGuild(guildId: string): Promise<AuditRecord[]> {
    return this.audits.find({ where: { guildId } })
  }

  create(message: GolemMessage, raw: string): Promise<AuditRecord> {
    const audit = this.audits.create({
      traceId: message.traceId,
      expanded: message.info.parsed.content,
      guildId: message.info.guildId,
      userId: message.info.userId,
      raw: raw,
      timestamp: Date.now(),
    })

    return this.audits.save(audit)
  }

  async setError(message: GolemMessage, error: Error | any): Promise<void> {
    const record = await this.audits.findOne({
      where: { traceId: message.traceId },
    })

    if (record) {
      record.error = error

      await this.audits.update({ traceId: message.traceId }, record)
    }
  }

  all(): Promise<AuditRecord[]> {
    return this.audits.find({})
  }
}
