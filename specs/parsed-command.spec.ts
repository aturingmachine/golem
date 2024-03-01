import { ParsedCommand } from '../src/messages/parsed-command'

describe('Parsed Command', () => {
  let parsedCommand: ParsedCommand
  let raw: string

  it('should handle subcommands with mutliple place arguments that are filled with spaces', () => {
    raw = '$go playlist add "test playlist" rocket punch chiquita'

    parsedCommand = ParsedCommand.fromRaw(raw)

    expect(parsedCommand).toBeDefined()
    expect(parsedCommand.params.playlistname).toEqual('test playlist')
    expect(parsedCommand.params.query).toEqual('rocket punch chiquita')
  })

  it('should parse things with urls', () => {
    //
    raw =
      '$go play https://www.youtube.com/playlist?list=PLbxr0tBuEEpF1PFiDIwUkdDR5dsfx1ZUr --limit=100 --shuffle'

    parsedCommand = ParsedCommand.fromRaw(raw)

    console.log(parsedCommand.extendedArgs)

    expect(parsedCommand.params).toEqual({
      query:
        'https://www.youtube.com/playlist?list=PLbxr0tBuEEpF1PFiDIwUkdDR5dsfx1ZUr',
    })
  })
})
