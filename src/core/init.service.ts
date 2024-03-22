import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommandService } from '../commands/commands.service'
import { PlayerService } from '../music/player/player.service'
import { YoutubeCache } from '../music/youtube/cache/youtube-cache.service'
import { formatForLog } from '../utils/debug-utils'
import { JobTimer } from '../utils/time-utils'
import { ClientService } from './client.service'
import { CronService } from './cron.service'
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
    private players: PlayerService,
    private cron: CronService,
    private ytCache: YoutubeCache
  ) {
    this.log.setContext('InitService')
  }

  async runInit(botServer: DiscordBotServer): Promise<void> {
    this.log.info('Running Init Jobs.')

    const job = new JobTimer('init_jobs', async () => {
      await this.login(botServer)
      this.injectClient(botServer)
      this.addClientListeners()
      await this.registerCommands()
      await this.setInitial()

      this.cron.setCronJobs()

      // const ytCacheResult =
      await this.ytCache.cleanAndValidate()
      // this.clientService.messageAdmin(ytCacheResult.pretty_formatted)
    })

    await job.run()

    this.log.info(`Init Jobs completed in ${job.duration}.`)
  }

  shutdown(): void {
    this.log.info('shutting down')
    this.clientService.client?.destroy()
    process.exit(1)
  }

  /**
   * Add Listeners to the Client
   */
  private addClientListeners(): void {
    this.clientService.client?.on(
      'voiceStateUpdate',
      async (oldState, newState) => {
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
        const player = this.players.forGuild(newState.guild.id)

        this.log.debug(
          `${formatForLog({
            channel: newState.channel?.name,
            membersCount: newState.channel?.members.size,
          })}`
        )

        if (
          player &&
          newState.channelId === player.channelId &&
          (newState.channel?.members?.size || 0) > 1 &&
          player.isPlaying
        ) {
          this.log.debug(`member joined while playing - clearing timer`)
          await player.clearTimer()

          return
        }

        const lastUsers = Array.from(oldState.channel?.members?.values() || [])
        const hasPlayer = !!player

        if (!hasPlayer) {
          this.log.debug(
            `has no player - bailing`,
            'voiceStateUpdate:startTimer'
          )
          return
        }

        const eventIsInPlayerChannel = oldState.channelId === player.channelId

        if (!eventIsInPlayerChannel) {
          this.log.debug(
            `not in Golem's channel - bailing`,
            'voiceStateUpdate:startTimer'
          )
          return
        }

        const hasOnlyOneUserInChannel = lastUsers.length === 1

        if (!hasOnlyOneUserInChannel) {
          this.log.debug(
            `more than one user in channel - bailing`,
            'voiceStateUpdate:startTimer'
          )
          return
        }

        const isLastUserBot = lastUsers[0].id === this.clientService.botId

        if (!isLastUserBot) {
          this.log.debug(
            `last user in channel is not Golem - bailing`,
            'voiceStateUpdate:startTimer'
          )
          return
        }

        this.log.log(
          `no members left in channel with bot - starting auto-dc timer`,
          'voiceStateUpdate:startTimer'
        )

        player.startTimer()
      }
    )
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
    this.clientService.startPresenceManager()
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
