import { CommandInteraction, Message } from 'discord.js'

export enum BotInteractionTypes {
  SlashCommand = 'SlashCommand',
  Command = 'Command',
  MenuClick = 'MenuClick',
  ButtonClick = 'ButtonClick',
}

type AnalyticsPayload = Record<string, string | number | boolean | undefined>

export interface GolemBotInteraction {
  type: BotInteractionTypes
  userId: string
  userName: string
  timestamp: number
  payload?: AnalyticsPayload
}

export class CommandAnalyticsInteraction implements GolemBotInteraction {
  type: BotInteractionTypes
  userId: string
  userName: string
  timestamp: number
  payload?: AnalyticsPayload

  constructor(
    interaction: CommandInteraction | Message,
    payload?: AnalyticsPayload
  ) {
    const isSlashCommand = interaction instanceof CommandInteraction
    this.type = isSlashCommand
      ? BotInteractionTypes.SlashCommand
      : BotInteractionTypes.Command
    this.userId = interaction.member?.user.id || ''
    this.userName = interaction.member?.user.username || ''
    this.timestamp = Date.now()
    this.payload = payload
  }
}
