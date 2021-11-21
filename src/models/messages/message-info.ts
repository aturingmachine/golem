import {
  Guild,
  GuildMember,
  Interaction,
  Message,
  StageChannel,
  VoiceChannel,
} from 'discord.js'
import { Permission, UserPermission } from '../../permissions/permission'

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

  /**
   * Get the Permissions record for this user in this guild
   */
  get permissions(): Promise<UserPermission> {
    return UserPermission.get(this.userId, this.guildId)
  }

  /**
   * Check if this user can do some action in this guild
   * @param perms
   * @returns
   */
  async can(perms: Permission[]): Promise<boolean> {
    return (await this.permissions).can(perms)
  }
}
