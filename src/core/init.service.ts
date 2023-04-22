import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommandService } from '../commands/commands.service'
import { PlayerService } from '../music/player/player.service'
import { formatForLog } from '../utils/debug-utils'
import { ClientService } from './client.service'
import { DiscordBotServer } from './discord-transport'
import { GuildConfigService } from './guild-config/guild-config.service'
import { LoggerService } from './logger/logger.service'
import { PermissionsService } from './permissions/permissions.service'

@Injectable()
export class InitService {
  constructor(
    private log: LoggerService,
    private permissions: PermissionsService,
    private guildConfig: GuildConfigService,
    private config: ConfigService,
    private clientService: ClientService,
    private commands: CommandService,
    private players: PlayerService
  ) {
    this.log.setContext('InitService')
  }

  async runInit(botServer: DiscordBotServer): Promise<void> {
    await this.login(botServer)
    this.injectClient(botServer)
    this.addClientListeners()
    await this.registerCommands()
    await this.setInitial()
  }

  shutdown(): void {
    this.log.info('shutting down')
    this.clientService.client?.destroy()
  }

  /**
   * Add Listeners to the Client
   */
  private addClientListeners(): void {
    this.clientService.client?.on('voiceStateUpdate', (oldState, newState) => {
      const debugServer = this.config.get('discord.debug')
      const hasDebugServer =
        !!debugServer.channelId &&
        !!debugServer.channelName &&
        !!debugServer.guildId &&
        !!debugServer.guildName

      if (hasDebugServer) {
        this.log.debug('has debug server, doing nothing...')
        return
      }

      this.log.debug(`Received voice state update ${newState.guild.id}`)
      const player = this.players.for(newState.guild.id)

      this.log.debug(
        `${formatForLog({
          channel: oldState.channel?.name,
          membersCount: oldState.channel?.members.size,
        })}`
      )

      if (
        player &&
        newState.channelId === player.channelId &&
        (newState.channel?.members?.size || 0) > 1 &&
        player.isPlaying
      ) {
        this.log.debug(`member joined while playing - clearing timer`)
        player.clearTimer()
      }

      if (
        player &&
        oldState.channelId === player.channelId &&
        oldState.channel?.members.size === 1
      ) {
        this.log.debug(
          `no members left in channel with bot - starting auto-dc timer`
        )
        player.startTimer()
      }
    })
  }

  /**
   * Login using the provided bot server.
   *
   * @param botServer
   */
  private async login(botServer: DiscordBotServer): Promise<void> {
    this.log.info('Logging in...')
    await botServer.login(this.config.get('discord.token'))
    this.log.info(`Logged in.`)
  }

  /**
   * Inject the Client into our ClientService instance.
   *
   * @param botServer
   */
  private injectClient(botServer: DiscordBotServer): void {
    this.log.debug('Injecting client instance to container')
    this.clientService.client = botServer.client
    this.log.debug('Client instance injected')
  }

  /**
   * Registers all commands.
   */
  private async registerCommands(): Promise<void> {
    this.log.debug('registering commands')
    await this.commands.registerCommands()
    this.log.debug('commands registered')
  }

  /**
   * Set initial values for Configs, Permissions, Etc.
   * @returns
   */
  private async setInitial(): Promise<void> {
    if (!this.clientService.client) {
      return
    }

    const adminId: string = this.config.getOrThrow('discord.adminId')

    for (const item of this.clientService.guildManager.cache) {
      const guild = item[1]
      this.log.debug(`initializing settings for [${guild.name}:${guild.id}]`)

      // Init Permissions
      await this.setPermissions(guild.id, guild.ownerId, adminId)

      // Init GuildConfig
      await this.setConfig(guild.id)
    }
  }

  private async setConfig(guildId: string): Promise<void> {
    this.log.debug(`processing initial config for guild: ${guildId}`)
    await this.guildConfig.getOrCreateDefault(guildId)
  }

  private async setPermissions(
    guildId: string,
    ownerId: string,
    adminId: string
  ): Promise<void> {
    // Set Bot Admin for the Server
    await this.permissions.for({
      userId: adminId,
      guildId: guildId,
    })

    if (ownerId === adminId) {
      return
    }

    this.log.debug(`setting initial for guild owner: ${ownerId}`)

    // Set Server owner as Moderator for the Server
    await this.permissions.for({
      userId: ownerId,
      guildId: guildId,
    })
  }
}
