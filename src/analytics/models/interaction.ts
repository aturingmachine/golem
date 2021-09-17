import { CommandInteraction, Message } from 'discord.js'
import mongoose, { Schema } from 'mongoose'

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

const schema = new Schema<GolemBotInteraction>({
  type: String,
  userId: String,
  userName: String,
  timestamp: Number,
  payload: {
    type: Map,
  },
})

export const BotInteractionData = mongoose.model<GolemBotInteraction>(
  'BotInteraction',
  schema
)

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
