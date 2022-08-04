import { Injectable } from '@nestjs/common'
import { LoggerService } from '../../core/logger/logger.service'
import { MusicPlayer } from './player'

@Injectable()
export class PlayerService {
  private readonly _cache: Map<string, MusicPlayer> = new Map()

  constructor(private log: LoggerService) {}

  for(channelId: string): MusicPlayer | undefined {
    return this._cache.get(channelId)
  }

  create(): MusicPlayer | undefined {}
}
