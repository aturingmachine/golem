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
})
