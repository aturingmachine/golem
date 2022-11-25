import { TemplateTag } from 'common-tags'

const smartSplitRegex = /"([^"]*)"|(\S+)|( \-\-[A-z\-]+)/g

export const StringUtils = {
  /**
   * Split a string on spaces, treating strings contained in double quotes as
   * separate unique tokens
   * @param str
   * @returns
   */
  smartSplit(str: string): string[] {
    return (str.match(smartSplitRegex) || [])
      .map((m) => m.replace(smartSplitRegex, '$1$2').replace('"', ''))
      .filter(Boolean)
  },

  slugify(str: string): string {
    return str
      ? str
          .replace(/^\s+|\s+$/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9 -]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
      : ''
  },

  dropWords(str: string, count: number): string {
    let index = 0

    for (let i = 1; i <= count; i++) {
      index = str.indexOf(' ', index + 1)
    }

    if (index < 0) {
      return ''
    }

    return str.slice(index).trimStart()
  },

  wordAt(msg: string, index: number): string {
    return msg.split(' ')[index]
  },

  as: {
    bold(msg: string): string {
      return `**${msg}**`
    },

    italic(msg: string): string {
      return `_${msg}_`
    },

    inline(msg: string): string {
      return `\`${msg}\``
    },

    preformat(msg: string): string {
      return `\`\`\`${msg}\`\`\``
    },
  },
}

export const StringFormat = {
  bold: new TemplateTag({
    onEndResult: (string) => {
      return `**${string.replace(/\*/g, `\*`)}**`
    },
  }),

  preformatted: new TemplateTag({
    onEndResult: (endResult) => {
      return `\`\`\`${endResult.replace('`', `\\\``)}\`\`\``
    },
  }),

  inline: new TemplateTag({
    onEndResult: (string) => {
      return `\`${string.replace('`', `\\\``)}\``
    },
  }),
}
