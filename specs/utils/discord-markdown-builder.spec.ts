import { DiscordMarkdown } from '../../src/utils/discord-markdown-builder'

describe('Discord Markdown Builder', () => {
  let markdown: DiscordMarkdown

  beforeEach(() => {
    markdown = DiscordMarkdown.start()
  })

  describe('raw', () => {
    it('should add to the content of the markdown', () => {
      markdown.raw('This is plain text')

      expect(markdown.toString()).toEqual('This is plain text')
    })
  })

  describe('newLine', () => {
    it('should append a newline', () => {
      markdown.newLine()

      expect(markdown.toString()).toEqual('\n')
    })
  })

  describe('bold', () => {
    it('should return the builder with the content wrapped in asteriks', () => {
      markdown.bold('This text should be bold!')

      expect(markdown.toString()).toEqual('*This text should be bold!*')
    })

    it('should escape any asteriks that are in the content to bold', () => {
      markdown.bold('This *text* should be bold!')

      expect(markdown.toString()).toEqual('*This \\*text\\* should be bold!*')
    })
  })

  describe('italic', () => {
    it('should return the builder with the content wrapped in underscores', () => {
      markdown.italic('This text should be italics!')

      expect(markdown.toString()).toEqual('_This text should be italics!_')
    })

    it('should escape any underscores that are in the content to italicize', () => {
      markdown.italic('This _text_ should be italics!')

      expect(markdown.toString()).toEqual(
        '_This \\_text\\_ should be italics!_'
      )
    })
  })

  describe('code', () => {
    it('should return the builder with the content wrapped in backticks', () => {
      markdown.code('This text should be code!')

      expect(markdown.toString()).toEqual('`This text should be code!`')
    })

    it('should escape any backticks that are in the content to format', () => {
      markdown.code('This `text` should be code!')

      expect(markdown.toString()).toEqual('`This \\`text\\` should be code!`')
    })
  })

  describe('preformat', () => {
    it('should return the builder with the content wrapped in triple backticks', () => {
      markdown.preformat('This text should be preformatted!')

      expect(markdown.toString()).toEqual(
        '```This text should be preformatted!```'
      )
    })

    it('should escape any triple backticks that are in the content to format', () => {
      markdown.preformat('This ```text``` should be preformatted!')

      expect(markdown.toString()).toEqual(
        '```This \\`\\`\\`text\\`\\`\\` should be preformatted!```'
      )
    })
  })
})
