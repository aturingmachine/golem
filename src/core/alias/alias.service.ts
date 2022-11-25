import { Injectable } from '@nestjs/common'
import { LoggerService } from '../logger/logger.service'

@Injectable()
export class AliasService {
  constructor(private log: LoggerService) {
    this.log.setContext('AliasService')
  }

  //
}
