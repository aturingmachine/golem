import {
  PermissionCode,
  tablePermissions,
} from '../../core/permissions/permissions'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class PermissionChangeReply extends BaseReply {
  type = ReplyType.PermissionChanged
  isUnique = false

  constructor(record: PermissionCode[], title?: string) {
    let content = tablePermissions(record)

    if (title) {
      content = `${title}\n${content}`
    }

    content = '```\n' + content + '\n```'

    super({ content })
  }
}
