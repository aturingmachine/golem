/* eslint-disable @typescript-eslint/no-var-requires */
const { readFileSync, writeFileSync } = require('fs')
const path = require('path')
const commands = require('./src/.vuepress/data/commands.json')

const commandTemplate = readFileSync(
  path.resolve(__dirname, './command-template.md'),
  { encoding: 'utf-8' }
)

class DocCommand {
  constructor(cmd) {
    this.info = cmd.options.info
    this.modules = this.info.requiredModules
  }

  get description() {
    return this.info.description.long || this.info.description.short
  }

  argsString(args = this.info.args, level = 1) {
    if (!args.length) {
      return ''
    }

    const argStrings = args.map((arg) => {
      // eslint-disable-next-line prettier/prettier
      return `${level > 1 ? '\t' : ''}- **${arg.name}**${arg.required ? '\*' : ''} - \`${arg.type}\`: ${arg.description.long || arg.description.short}`
    })

    return `${level === 1 ? '##' : '\n\t###'} Arguments\n`.concat(
      argStrings.join('\n')
    )
  }

  get legacyExample() {
    return this.info.examples.legacy.join('\n')
  }

  get slashExample() {
    return this.info.examples.slashCommand.join('\n')
  }

  get subcommands() {
    if (!this.info.subcommands) {
      return ''
    }

    const subcommandMarkdown = this.info.subcommands.map((subcmd) => {
      return `- **${subcmd.name}**: ${
        subcmd.description.long || subcmd.description.short
      }`.concat(subcmd.args ? this.argsString(subcmd.args, 2) : '')
    })

    return '## Subcommands\n'.concat(subcommandMarkdown.join('\n\n'))
  }

  get badges() {
    if (!this.modules) {
      return ''
    }

    const all =
      this.modules.all?.map(
        (mod) => `<badge text="${mod}" type="${mod.toLowerCase()}-badge" />`
      ) || []
    const oneOfMods =
      this.modules.oneOf?.map(
        (mod) =>
          `<badge text="${mod}*" type="${mod.toLowerCase()}-badge optional-mod-badge tooltip-root"/>`
      ) || []

    return all.join(' ').concat(oneOfMods.join(' '))
  }

  get extendedArguments() {
    if (!this.info.extendedArgs || this.info.extendedArgs.length < 1) {
      return []
    }

    return this.info.extendedArgs.reduce((prev, curr) => {
      return prev.concat(
        `\n- **${curr.key}**\n\t- Type: \`${curr.type}\`\n\t- ${curr.description}`
      )
    }, '## Extended Arguments\n')
  }
}

commands.forEach((cmd) => {
  console.log(`[DOCGEN] Rending page for command ${cmd.options.info.name}`)
  const fp = path.resolve(
    __dirname,
    `./src/commands/${cmd.options.info.name}.md`
  )

  const command = new DocCommand(cmd)

  console.log('modules', command.modules)
  console.log('badges', command.badges)

  const content = commandTemplate
    .replaceAll('<%name>', cmd.options.info.name)
    .replaceAll('<%description>', command.description)
    .replaceAll('<%legacy_command_example>', command.legacyExample)
    .replaceAll('<%slash_command_example>', command.slashExample)
    .replaceAll('<%arguments>', command.argsString())
    .replaceAll('<%subcommands>', command.subcommands)
    .replaceAll('<%badge>', command.badges)
    .replaceAll('<%extended_args>', command.extendedArguments)

  writeFileSync(fp, content, { encoding: 'utf-8' })
  console.log(`[DOCGEN] Page rendered at ${fp}`)
})
