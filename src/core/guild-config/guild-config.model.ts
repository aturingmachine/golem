import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import { DiscordMarkdown } from '../../utils/discord-markdown-builder'

@Entity()
export class GuildConfig {
  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  guildId!: string

  @Column()
  defaultChannelId?: string

  @Column()
  subscribedToUpdates!: boolean

  static describe(): string {
    return DiscordMarkdown.start()
      .bold('Golem Bot - Guild Settings')
      .newLine()
      .code('defaultChannelId')
      .raw(' - the channel to send updates to')
      .newLine()
      .code('subscribedToUpdates')
      .raw(
        ' - whether or not to send updates to this guild\'s "defaultChannelId"'
      )
      .toString()
  }

  static update<T extends keyof Omit<GuildConfig, '_id' | 'guildId'>>(
    config: GuildConfig,
    key: T,
    value: string
  ): GuildConfig {
    const castedValued = GuildConfig.castValue(key, value)

    if (!castedValued) {
      return config
    }

    // wtf
    config[key] = castedValued as unknown as never

    return config
  }

  static castValue<T extends keyof Omit<GuildConfig, '_id' | 'guildId'>>(
    key: T,
    value: string
  ): GuildConfig[keyof Omit<GuildConfig, '_id' | 'guildId'>] | undefined {
    switch (key) {
      case 'defaultChannelId':
        return value
      case 'subscribedToUpdates':
        return value === 'true'
      default:
        return undefined
    }
  }
}
