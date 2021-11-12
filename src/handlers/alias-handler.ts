import { CommandInteraction, Message } from 'discord.js'
import { CustomAlias } from '../models/custom-alias'
import { CustomAliasData } from '../models/db/custom-alias'
import { MessageInfo } from '../models/messages/message-info'
import { Permissions, UserPermission } from '../permissions/permission'
import { formatForLog } from '../utils/debug-utils'
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
    if (!(await UserPermission.check(interaction, Permissions.Alias.Create))) {
      await interaction.reply({
        ephemeral: true,
        content: 'Missing Permission alias.create',
      })
      return
    }

    try {
      const alias = await CustomAlias.fromString(aliasCommand, guildId, userId)
      this.log.verbose(`saving new alias ${alias.name} -> ${alias.unevaluated}`)
      this.log.debug(alias.toString())

      await new CustomAlias(alias).save()

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

  async deleteAlias(
    interaction: CommandInteraction | Message,
    name: string
  ): Promise<void> {
    const info = new MessageInfo(interaction)
    const record = await CustomAliasData.findOne({
      guildId: info.guildId,
      name,
    }).exec()

    if (!record) {
      this.log.warn(`could not find alias for ${name} on ${info.guildId}`)
      interaction.reply({
        ephemeral: true,
        content: `no alias of name ${name} found.`,
      })
      return
    }

    this.log.debug(`found record to delete ${formatForLog(record?.toObject())}`)

    const isOwn = record.createdBy === info.userId

    if (!isOwn) {
      const permissions = await info.permissions
      if (!permissions.can(Permissions.Alias.Delete.Any)) {
        // user cannot delete someone elses alias
        interaction.reply({
          ephemeral: true,
          content: 'cannot delete alias created by another user',
        })
        return
      }
    }

    record.delete()
    interaction.reply({
      content: `${Replier.affirmative}. Alias ${name} has been deleted.`,
    })
    return
  },
}
