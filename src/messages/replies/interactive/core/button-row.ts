import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders'
import { ButtonStyle } from 'discord.js'
import { ButtonIdPrefixes } from '../constants'
import { CustomIdConfig, CustomId } from '../custom-id'

export type ButtonOptions = {
  customId: Omit<CustomIdConfig<ButtonIdPrefixes>, 'type'>
  label: string
  style: ButtonStyle
  disabled?: boolean
}

type RowOptions = {
  type: ButtonIdPrefixes
  buttons: ButtonOptions[]
}

export class ButtonRow {
  constructor(public options: RowOptions) {}

  toRow(): ActionRowBuilder<ButtonBuilder> {
    const buttons = this.options.buttons.map((button) =>
      new ButtonBuilder()
        .setCustomId(
          new CustomId({
            ...button.customId,
            type: this.options.type,
          }).toString()
        )
        .setLabel(button.label)
        .setStyle(button.style)
        .setDisabled(!!button.disabled)
    )

    return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)
  }
}
