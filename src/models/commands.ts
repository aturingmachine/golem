import { Interaction, Message } from 'discord.js'

export interface Command {
  data: any
  execute: (interaction: Interaction | Message) => Promise<any>
}
