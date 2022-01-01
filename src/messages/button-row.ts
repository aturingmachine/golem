import { MessageActionRow, MessageButton, MessageButtonStyle } from 'discord.js'
import { ButtonIdPrefixes } from '../handlers/button-handler'
import { CustomId, CustomIdConfig } from './custom-id'

export type ButtonOptions = {
  customId: Omit<CustomIdConfig<ButtonIdPrefixes>, 'type'>
  label: string
  style: MessageButtonStyle
  disabled?: boolean
}

type RowOptions = {
  type: ButtonIdPrefixes
  buttons: ButtonOptions[]
}

export class ButtonRow {
  constructor(public options: RowOptions) {}

  toRow(): MessageActionRow {
    const buttons = this.options.buttons.map((button) =>
      new MessageButton()
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

    return new MessageActionRow().addComponents(...buttons)
  }
}
