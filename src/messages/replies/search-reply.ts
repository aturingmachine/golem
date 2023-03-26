import { APIEmbedField, EmbedBuilder, MessageReplyOptions } from 'discord.js'
import { Constants, embedFieldSpacer } from '../../constants'
import { LocalListing } from '../../music/local/listings/listings'
import { BaseReply } from './base'
import { ReplyType } from './types'

// TODO
const getSearchReply = (
  query: string,
  results: LocalListing[],
  totalCount: number
): MessageReplyOptions => {
  const fields: APIEmbedField[] = results
    .map((res, index) => ({
      name: `Hit ${index + 1}`,
      value: res.longName,
      inline: true,
    }))
    .reduce((prev, curr, index) => {
      if (index && index % 2 === 0) {
        prev.push(embedFieldSpacer)
      }
      prev.push(curr)

      return prev
    }, [] as APIEmbedField[])

  const embed = new EmbedBuilder()
    .setTitle(`Top ${results.length} for "${query.toUpperCase()}"`)
    .setDescription(`Taken from **${totalCount}** total results`)
    .setFields(...fields, embedFieldSpacer)
    .setColor(Constants.baseColor)

  return {
    embeds: [embed],
  }
}

export class SearchReply extends BaseReply {
  readonly type = ReplyType.Search
  readonly isUnique = false

  constructor(
    readonly query: string,
    readonly trimmedResults: LocalListing[],
    readonly resultCount: number
  ) {
    super(getSearchReply(query, trimmedResults, resultCount))
  }
}
