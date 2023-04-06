import { v4 } from 'uuid'
import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { ClientService } from '../../core/client.service'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { Replies } from '../../messages/replies/replies'

export default new GolemCommand({
  logSource: 'GoReport',

  services: {
    log: LoggerService,
    client: ClientService,
  },

  subcommands: {},

  async handler(props) {
    const msg = props.source.getString('reportmessage')

    if (!msg) {
      throw Errors.BadArgs({
        argName: 'reportmessage',
        message: 'A message is required.',
        sourceCmd: 'report',
      })
    }

    const id = v4().slice(0, 6)
    const user = `${props.message.info.member?.displayName} (${props.message.info.member?.nickname})`
    const guild = props.message.info.guild?.name

    const date = new Date().toUTCString()

    const dm = `\`\`\`GOLEM REPORT ${date}
-----
INFO
  USER: ${user} @ ${guild}
  REPORT ID: ${id}
-----
CONTENT
*******
  ${msg}
*******
    \`\`\`
    `

    this.services.log.info('Sending Report to Admin')
    await this.services.client.messageAdmin(dm)

    await props.message.addReply(
      Replies.Raw(
        `Thank you for your report!\nYour Report has been assigned an ID \`${id}\`. This may help in the situation you need to follow up with your Golem Bot Admin.`
      )
    )
  },

  info: {
    name: CommandNames.Base.report,
    description: {
      short:
        'Report a bug/issue or provide a suggestion to the admin of this Golem Bot.',
    },
    args: [
      {
        type: 'string',
        name: 'reportmessage',
        description: {
          short: 'A description of the bug/issue/suggestion.',
        },
        required: true,
        rest: true,
      },
    ],
    examples: {
      legacy: ['$go report '],
      slashCommand: ['/goreport'],
    },
  },
})
