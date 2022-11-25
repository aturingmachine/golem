import { Parser } from '../src/ast/parser'

describe('Parser', () => {
  let parser: Parser

  it('should parse a single $go command', () => {
    parser = new Parser('$go play twice tt')

    const result = parser.parse()

    expect(result).toHaveLength(1)
    expect(result[0].type).toEqual('solo')
    expect(result[0].commands[0].tokens).toHaveLength(2)
    expect(result[0].commands[0].tokens[0]).toEqual({
      type: 'invoker',
      value: '$go',
    })
    expect(result[0].commands[0].tokens[1]).toEqual({
      type: 'str',
      value: 'twice tt',
    })
  })
})
