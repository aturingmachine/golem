import { CommandInteraction, Message } from 'discord.js'
import { CustomAlias } from '../models/custom-alias'
import { CustomAliasData } from '../models/db/custom-alias'
import { GolemLogger, LogSources } from '../utils/logger'
import { Replier } from '../utils/replies'

export const AliasHandler = {
  log: GolemLogger.child({ src: LogSources.AliasHandler }),

  async createAlias(
    interaction: CommandInteraction | Message,
    aliasCommand: string,
    guildId: string,
    userId: string
  ): Promise<void> {
    try {
      const alias = await CustomAlias.fromString(aliasCommand, guildId, userId)
      this.log.verbose(`saving new alias ${alias.name} -> ${alias.unevaluated}`)
      this.log.debug(alias.toString())

      await new CustomAliasData(alias).save()

      await interaction.reply(
        `${Replier.affirmative}! \`$${alias.name}\` will now execute as \`${alias.unevaluated}\``
      )
    } catch (error) {
      this.log.error(error)
      await interaction.reply(
        `${Replier.negative}, I couldn't make that alias. ${
          (error as Error).message
        }`
      )
    }
  },

  async listAliases(
    interaction: CommandInteraction | Message,
    guildId: string
  ): Promise<void> {
    try {
      const aliases = await CustomAlias.getAliases(guildId)

      const response = aliases
        .reduce((prev, curr) => {
          return prev.concat(`${curr.helpString}\n\n`)
        }, `\`\`\`\nAliases For ${interaction.guild?.name}\n`)
        .concat('```')

      await interaction.reply(response)
    } catch (error) {
      this.log.error(error)
      await interaction.reply(
        `${Replier.negative}, I couldn't fetch any aliases. ${
          (error as Error).message
        }`
      )
    }
  },
}
