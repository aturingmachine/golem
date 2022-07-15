import { Module } from '@nestjs/common'
import { GolemConf } from '.'

@Module({
  providers: [GolemConf],
  exports: [GolemConf],
})
export class ConfigModule {}
