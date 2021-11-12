import {
  Guild,
  GuildMember,
  Interaction,
  Message,
  StageChannel,
  VoiceChannel,
} from 'discord.js'
import { UserPermission } from '../../permissions/permission'

export class MessageInfo {
  public member: GuildMember | null
  public guild: Guild | null

  constructor(interaction: Message | Interaction) {
    this.member = interaction.member as GuildMember
    this.guild = interaction.guild
  }

  get userId(): string {
    return this.member?.user.id || ''
  }

  get guildId(): string {
    return this.guild?.id || ''
  }

  get voiceChannel(): VoiceChannel | StageChannel | null | undefined {
    return this.member?.voice.channel
  }

  get permissions(): Promise<UserPermission> {
    return UserPermission.get(this.userId, this.guildId)
  }
}
