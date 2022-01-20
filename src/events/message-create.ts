import { CustomAlias } from '../aliases/custom-alias'
import { CommandRunner } from '../commands/runner'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { GolemMessage } from '../messages/message-wrapper'
import { GolemLogger, LogSources } from '../utils/logger'
import { StringUtils } from '../utils/string-utils'
import { EventHandler } from '.'

const log = GolemLogger.child({ src: LogSources.MessageCreate })

const BuiltInCommands = [
  ...Object.keys(CommandNames.Base),
  ...Object.keys(CommandNames.Aliases),
]

const messageCreate: EventHandler<'messageCreate'> = {
  on: 'messageCreate',
  async execute(message) {
    // If the bot sent the message, don't try and parse it.
    if (message.author.id === Golem.client.user?.id) {
      return
    }

    // If the message doesn't match a pattern for our commands we can exit
    if (!/^\$(go )?/.test(message.content)) {
      return
    }

    log.silly(`${message.guild?.name} - received: ${message}`)

    // Can now assume we should make an attempt at parsing a command
    let wrapper: GolemMessage | undefined

    // We first need to parse the raw message content into uniform shape by removing the command invoker (i.e. $go or $play, etc...)
    const parsedContent = message.content.replace(/^\$(go )?/, '')

    log.silly(`parsed content - "${parsedContent}"`)
    console.log(BuiltInCommands)

    // Check if the message matches a build in command, or a built in alias.
    const builtIn = BuiltInCommands.find(
      (command) =>
        StringUtils.wordAt(parsedContent, 0).toLowerCase() ===
        command.toLowerCase()
    )

    // If we are using a built in, we can pass the raw message off to create a GolemMessage
    if (builtIn) {
      log.silly(`message parsed as - ${parsedContent} - matched built-in`)
      wrapper = new GolemMessage(message)
    }
    // We missed any builtins, check against custom aliases
    else {
      // TODO this still causes issues for arg passing to aliases
      // Try to find an alias for this Guild that matches the message invocation
      const matchedAlias = (
        await CustomAlias.getAliases(message.guildId || '')
      ).find((alias) => parsedContent === alias.name)

      // We matched a custom alias, create a GolemMessage using the message and the found alias
      if (matchedAlias) {
        log.silly(
          `message parsed as - ${parsedContent} - matched custom alias ${matchedAlias.name}`
        )
        wrapper = new GolemMessage(message, matchedAlias)
      }
    }

    // If we have a GolemMessage we can execute its associated command!
    if (wrapper) {
      log.silly(`running command for wrapper ${wrapper.toDebug()}`)
      await wrapper.source.channel?.sendTyping()
      await CommandRunner(wrapper)
      return
    }

    log.silly(`not match for raw content - ${message.content}`)
  },
}

export default messageCreate
