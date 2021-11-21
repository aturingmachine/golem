import { Message } from 'discord.js'
import { CustomAlias } from '../aliases/custom-alias'
import { Handlers } from '../handlers'
import { GolemLogger, LogSources } from '../utils/logger'
import { guildIdFrom } from '../utils/message-utils'
import { EventHandler } from '.'

const log = GolemLogger.child({ src: LogSources.MessageCreate })

async function handleLegacy(message: Message): Promise<boolean> {
  try {
    const legacyResponse = await Handlers.Legacy.parseMessage(message)

    if (legacyResponse) {
      return true
    }

    return false
  } catch (error) {
    log.error(`error parsing message via legacy handler - ${error}`)
    return false
  }
}

async function handleAlias(message: Message): Promise<boolean> {
  try {
    const alias = await CustomAlias.getAliasFor(
      message.content,
      guildIdFrom(message)
    )

    if (alias) {
      await alias.run(message)

      return true
    }

    return false
  } catch (error) {
    log.error(`unable to handle alias command - ${message.content} - ${error}`)
    return false
  }
}

const messageCreate: EventHandler<'messageCreate'> = {
  on: 'messageCreate',
  async execute(message) {
    if (message.member?.id === '884552685028790305') {
      return
    }

    log.silly(`${message.guild?.name} - received: ${message}`)

    if (message.content.startsWith('$go') || message.content.startsWith('$')) {
      await message.channel.sendTyping()

      const legacyResponse = await handleLegacy(message)

      if (legacyResponse) {
        return
      }

      await handleAlias(message)
    }
  },
}

export default messageCreate
