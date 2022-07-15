// import { GolemMessage } from '../messages/message-wrapper'
// import { Permissions } from '../permissions/permission'
// import { formatForLog } from '../utils/debug-utils'
// import { GolemLogger, LogSources } from '../utils/logger'
// import { Replier } from '../utils/replies'
// import { CustomAlias } from './custom-alias'

// export const AliasHandler = {
//   log: GolemLogger.child({ src: LogSources.AliasHandler }),

//   async createAlias(
//     interaction: GolemMessage,
//     aliasCommand: string
//   ): Promise<void> {
//     if (!(await interaction.info.can(Permissions.Alias.Create))) {
//       await interaction.reply({
//         ephemeral: true,
//         content: 'Missing Permission alias.create',
//       })
//       return
//     }

//     try {
//       const alias = await CustomAlias.fromString(
//         aliasCommand,
//         interaction.info.guildId,
//         interaction.info.userId
//       )
//       this.log.verbose(`saving new alias ${alias.name} -> ${alias.unevaluated}`)
//       this.log.debug(alias.toString())

//       await alias.save()

//       await interaction.reply(
//         `${Replier.affirmative}! \`$${alias.name}\` will now execute as \`${alias.unevaluated}\``
//       )
//     } catch (error) {
//       this.log.error(error)
//       await interaction.reply(
//         `${Replier.negative}, I couldn't make that alias. ${
//           (error as Error).message
//         }`
//       )
//     }
//   },

//   async listAliases(interaction: GolemMessage, guildId: string): Promise<void> {
//     try {
//       const aliases = await CustomAlias.getAliases(guildId)

//       const response = aliases
//         .reduce((prev, curr) => {
//           return prev.concat(`${curr.helpString}\n\n`)
//         }, `\`\`\`\nAliases For ${interaction.source.guild?.name}\n`)
//         .concat('```')

//       await interaction.reply(response)
//     } catch (error) {
//       this.log.error(error)
//       await interaction.reply(
//         `${Replier.negative}, I couldn't fetch any aliases. ${
//           (error as Error).message
//         }`
//       )
//     }
//   },

//   async deleteAlias(interaction: GolemMessage, name: string): Promise<void> {
//     const record = await CustomAlias.findOne({
//       guildId: interaction.info.guildId,
//       name,
//     })

//     if (!record) {
//       this.log.warn(
//         `could not find alias for ${name} on ${interaction.info.guildId}`
//       )
//       interaction.reply({
//         ephemeral: true,
//         content: `no alias of name ${name} found.`,
//       })
//       return
//     }

//     this.log.debug(`found record to delete ${formatForLog(record)}`)

//     const isOwn = record.createdBy === interaction.info.userId

//     if (!isOwn) {
//       if (!(await interaction.info.can(Permissions.Alias.Delete))) {
//         // user cannot delete someone else's alias
//         interaction.reply({
//           ephemeral: true,
//           content: 'cannot delete alias created by another user',
//         })
//         return
//       }
//     }

//     await record.delete()
//     interaction.reply({
//       content: `${Replier.affirmative}. Alias ${name} has been deleted.`,
//     })
//     return
//   },
// }
