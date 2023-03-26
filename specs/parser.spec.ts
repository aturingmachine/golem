import { AstParseResult, Parser } from '../src/ast/parser'
import '../src/commands/register-commands'
import { debugDump } from '../test-utils/debug-dump'

describe('Parser', () => {
  let parser: Parser
  let command: string

  describe('Invalid Case Handling', () => {
    it('should handle strings that contain no commmands', () => {
      command = 'I have nothing valid!'

      const result = testParse()

      expect(result).toHaveLength(0)
    })

    it('should strip and_blocks that contain an invalid command', () => {
      command = 'I have nothing valid! && $go play twice tt'

      const result = testParse()

      expect(result).toHaveLength(0)
    })

    it('should strip invalid solo commands in non-strict mode', () => {
      command = 'I have nothing valid!; $go play twice tt'

      const result = testParse()

      expect(result).toHaveLength(1)

      const firstBlock = result.blocks[0]
      expect(firstBlock).toHaveLength(1)

      expect(firstBlock.type).toEqual('solo')
      expect(firstBlock.commands[0].tokens).toHaveLength(3)
      expect(firstBlock.commands[0].tokens[0]).toEqual({
        insideAlias: false,
        type: 'invoker',
        value: '$go',
      })
      expect(firstBlock.commands[0].tokens[1]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[0].tokens[2]).toEqual({
        insideAlias: false,
        type: 'str',
        value: 'twice tt',
      })
    })

    it('should strip invalid solo commands in non-strict mode while keeping and_blocks that are valid', () => {
      command =
        'I have nothing valid!; $go play twice tt && $go play loona so what'

      const result = testParse()

      expect(result).toHaveLength(1)

      const firstBlock = result.blocks[0]
      expect(firstBlock).toHaveLength(2)

      expect(firstBlock.type).toEqual('and_block')
      expect(firstBlock.commands[0].tokens).toHaveLength(3)
      expect(firstBlock.commands[0].tokens[0]).toEqual({
        insideAlias: false,
        type: 'invoker',
        value: '$go',
      })
      expect(firstBlock.commands[0].tokens[1]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[0].tokens[2]).toEqual({
        insideAlias: false,
        type: 'str',
        value: 'twice tt',
      })

      expect(firstBlock.commands[1].tokens).toHaveLength(3)
      expect(firstBlock.commands[1].tokens[0]).toEqual({
        insideAlias: false,
        type: 'invoker',
        value: '$go',
      })
      expect(firstBlock.commands[1].tokens[1]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[1].tokens[2]).toEqual({
        insideAlias: false,
        type: 'str',
        value: 'loona so what',
      })
    })
  })

  describe('Command Aliases', () => {
    /**
     * @note some of these commands are not actually valid syntax
     * _for that command_ but exist as such for testing purposes.
     */
    it.each(['play', 'stop', 'pause', 'playnext'])(
      'should handle $%s as an invoker alias',
      (aliasName) => {
        command = `${aliasName} twice tt`

        const result = testParse()

        expect(result).toHaveLength(1)

        const firstBlock = result.blocks[0]

        expect(firstBlock.type).toEqual('solo')
        expect(firstBlock).toHaveLength(1)

        expect(firstBlock.commands[0].tokens).toHaveLength(2)
        expect(firstBlock.commands[0].tokens[0]).toEqual({
          insideAlias: false,
          type: 'cmd',
          value: aliasName,
        })
        expect(firstBlock.commands[0].tokens[1]).toEqual({
          insideAlias: false,
          type: 'str',
          value: 'twice tt',
        })
      }
    )

    it('should handle $play as an invoker alias', () => {
      command = `$play twice tt`

      const result = testParse()

      expect(result).toHaveLength(1)

      const firstBlock = result.blocks[0]

      expect(firstBlock.type).toEqual('solo')
      expect(firstBlock).toHaveLength(1)

      expect(firstBlock.commands[0].tokens).toHaveLength(2)
      expect(firstBlock.commands[0].tokens[0]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[0].tokens[1]).toEqual({
        insideAlias: false,
        type: 'str',
        value: 'twice tt',
      })
    })
  })

  describe('Advanced Parsing', () => {
    it('should handle options that use quotes', () => {
      command = '$go play twice tt --some_opt="this has quotes" --another_one'

      const result = testParse()

      expect(result).toHaveLength(1)

      const firstBlock = result.blocks[0]

      expect(firstBlock.commands[0].tokens[3]).toEqual({
        insideAlias: false,
        type: 'opt',
        value: '--some_opt="this has quotes"',
        name: 'some_opt',
        opt_val: 'this has quotes',
      })
      expect(firstBlock.commands[0].tokens[4]).toEqual({
        insideAlias: false,
        type: 'opt',
        value: '--another_one',
        name: 'another_one',
        opt_val: 'true',
      })
    })

    it('should handle escaped quotes', () => {
      // eslint-disable-next-line prettier/prettier
      command = '$go play twice tt --some_opt="this \\"has\\" quotes"'

      const result = testParse()

      expect(result).toHaveLength(1)

      const firstBlock = result.blocks[0]

      expect(firstBlock.commands[0].tokens[3]).toEqual({
        insideAlias: false,
        type: 'opt',
        // eslint-disable-next-line prettier/prettier
        value: `--some_opt="this \"has\" quotes"`,
        name: 'some_opt',
        opt_val: 'this "has" quotes',
      })
    })

    it('should report unclosed double quotes', () => {
      command = '$go play twice tt --some_opt="this has unclosed quotes'

      const result = testParse()

      expect(result.errors).toHaveLength(1)

      const firstError = result.errors[0]

      expect(firstError.error.message).toContain(
        'Unterminated DOUBLE quote in command'
      )
    })

    it('should throw an error for unknown function names', () => {
      command = '$go play :[something()]'

      const result = testParse()

      expect(result.errors).toHaveLength(1)
    })

    it('should support functions as option values', () => {
      command = '$go play %song_name --song_name=:[random(thing1, thing2)]'

      const result = testParse()

      debugDump(result)

      expect(result).toHaveLength(1)
      const firstBlock = result.blocks[0]

      expect(firstBlock.type).toEqual('solo')
      expect(firstBlock).toHaveLength(1)

      expect(firstBlock.commands[0]).toHaveLength(4)
      expect(firstBlock.commands[0].tokens[0]).toEqual({
        insideAlias: false,
        type: 'invoker',
        value: '$go',
      })
      expect(firstBlock.commands[0].tokens[1]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[0].tokens[2]).toEqual({
        insideAlias: false,
        type: 'var',
        value: '%song_name',
        name: 'song_name',
      })
      expect(firstBlock.commands[0].tokens[3]).toEqual({
        insideAlias: false,
        type: 'opt',
        value: '--song_name=:[random(thing1, thing2)]',
        name: 'song_name',
        opt_val: {
          insideAlias: false,
          type: 'func',
          name: 'random',
          param_names: ['thing1', 'thing2'],
          params: [
            {
              insideAlias: false,
              type: 'var',
              value: 'thing1',
              name: 'thing1',
            },
            {
              insideAlias: false,
              type: 'var',
              value: 'thing2',
              name: 'thing2',
            },
          ],
          value: ':[random(thing1, thing2)]',
        },
      })
    })

    it('should parse options', () => {
      command =
        '$go play twice tt --some_opt=a-string --another_opt=10 --bool --quote_opt="I can have spaces!"'

      const result = testParse()

      expect(result).toHaveLength(1)

      const firstBlock = result.blocks[0]

      expect(firstBlock.type).toEqual('solo')
      expect(firstBlock).toHaveLength(1)

      expect(firstBlock.commands[0]).toHaveLength(7)
      expect(firstBlock.commands[0].tokens[0]).toEqual({
        insideAlias: false,
        type: 'invoker',
        value: '$go',
      })
      expect(firstBlock.commands[0].tokens[1]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[0].tokens[2]).toEqual({
        insideAlias: false,
        type: 'str',
        value: 'twice tt',
      })
      expect(firstBlock.commands[0].tokens[3]).toEqual({
        insideAlias: false,
        type: 'opt',
        value: '--some_opt=a-string',
        name: 'some_opt',
        opt_val: 'a-string',
      })
      expect(firstBlock.commands[0].tokens[4]).toEqual({
        insideAlias: false,
        type: 'opt',
        value: '--another_opt=10',
        name: 'another_opt',
        opt_val: '10',
      })
      expect(firstBlock.commands[0].tokens[5]).toEqual({
        insideAlias: false,
        type: 'opt',
        value: '--bool',
        name: 'bool',
        opt_val: 'true',
      })
      expect(firstBlock.commands[0].tokens[6]).toEqual({
        insideAlias: false,
        type: 'opt',
        value: '--quote_opt="I can have spaces!"',
        name: 'quote_opt',
        opt_val: 'I can have spaces!',
      })
    })
  })

  describe('Variables', () => {
    it('should use a % as a variable start', () => {
      command = '$go play %song-name %another_var'

      const result = testParse()

      expect(result).toHaveLength(1)

      const firstBlock = result.blocks[0]

      expect(firstBlock.type).toEqual('solo')
      expect(firstBlock).toHaveLength(1)

      expect(firstBlock.commands[0].tokens).toHaveLength(4)
      expect(firstBlock.commands[0].tokens[0]).toEqual({
        insideAlias: false,
        type: 'invoker',
        value: '$go',
      })
      expect(firstBlock.commands[0].tokens[1]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[0].tokens[2]).toEqual({
        insideAlias: false,
        type: 'var',
        value: '%song-name',
        name: 'song-name',
      })
      expect(firstBlock.commands[0].tokens[3]).toEqual({
        insideAlias: false,
        type: 'var',
        value: '%another_var',
        name: 'another_var',
      })
    })
  })

  describe('Functions', () => {
    it('should parse function', () => {
      command = '$go play twice tt :[random(param1, param_2)]'

      const result = testParse()

      const firstBlock = result.blocks[0]

      expect(firstBlock.type).toEqual('solo')
      expect(firstBlock).toHaveLength(1)

      expect(firstBlock.commands[0].tokens).toHaveLength(4)
      expect(firstBlock.commands[0].tokens[0]).toEqual({
        insideAlias: false,
        type: 'invoker',
        value: '$go',
      })
      expect(firstBlock.commands[0].tokens[1]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[0].tokens[2]).toEqual({
        insideAlias: false,
        type: 'str',
        value: 'twice tt',
      })
      expect(firstBlock.commands[0].tokens[3]).toEqual({
        insideAlias: false,
        type: 'func',
        value: ':[random(param1, param_2)]',
        param_names: ['param1', 'param_2'],
        name: 'random',
        params: [
          {
            insideAlias: false,
            type: 'var',
            value: 'param1',
            name: 'param1',
          },
          {
            insideAlias: false,
            type: 'var',
            value: 'param_2',
            name: 'param_2',
          },
        ],
      })
    })

    it('should use parse function mid command', () => {
      command = '$go play :[random(param1, param_2)] twice tt'

      const result = testParse()

      debugDump(result)

      const firstBlock = result.blocks[0]

      expect(firstBlock.type).toEqual('solo')
      expect(firstBlock).toHaveLength(1)

      expect(firstBlock.commands[0].tokens).toHaveLength(4)
      expect(firstBlock.commands[0].tokens[0]).toEqual({
        insideAlias: false,
        type: 'invoker',
        value: '$go',
      })
      expect(firstBlock.commands[0].tokens[1]).toEqual({
        insideAlias: false,
        type: 'cmd',
        value: 'play',
      })
      expect(firstBlock.commands[0].tokens[2]).toEqual({
        insideAlias: false,
        type: 'func',
        value: ':[random(param1, param_2)]',
        param_names: ['param1', 'param_2'],
        name: 'random',
        params: [
          {
            insideAlias: false,
            type: 'var',
            value: 'param1',
            name: 'param1',
          },
          {
            insideAlias: false,
            type: 'var',
            value: 'param_2',
            name: 'param_2',
          },
        ],
      })
      expect(firstBlock.commands[0].tokens[3]).toEqual({
        insideAlias: false,
        type: 'str',
        value: 'twice tt',
      })
    })
  })

  it('should parse a single $go command', () => {
    command = '$go play twice tt'

    const result = testParse()

    expect(result).toHaveLength(1)

    const firstBlock = result.blocks[0]

    expect(firstBlock.type).toEqual('solo')
    expect(firstBlock).toHaveLength(1)

    expect(firstBlock.commands[0].tokens).toHaveLength(3)
    expect(firstBlock.commands[0].tokens[0]).toEqual({
      insideAlias: false,
      type: 'invoker',
      value: '$go',
    })
    expect(firstBlock.commands[0].tokens[1]).toEqual({
      insideAlias: false,
      type: 'cmd',
      value: 'play',
    })
    expect(firstBlock.commands[0].tokens[2]).toEqual({
      insideAlias: false,
      type: 'str',
      value: 'twice tt',
    })
  })

  it('should parse an and_block chained command', () => {
    command = '$go play twice tt && $go play loona so what'

    const result = testParse()

    expect(result).toHaveLength(1)

    const firstBlock = result.blocks[0]

    expect(firstBlock.type).toEqual('and_block')
    expect(firstBlock).toHaveLength(2)

    expect(firstBlock.commands[0].tokens).toHaveLength(3)
    expect(firstBlock.commands[0].tokens[0]).toEqual({
      insideAlias: false,
      type: 'invoker',
      value: '$go',
    })
    expect(firstBlock.commands[0].tokens[1]).toEqual({
      insideAlias: false,
      type: 'cmd',
      value: 'play',
    })
    expect(firstBlock.commands[0].tokens[2]).toEqual({
      insideAlias: false,
      type: 'str',
      value: 'twice tt',
    })

    expect(firstBlock.commands[1].tokens).toHaveLength(3)
    expect(firstBlock.commands[1].tokens[0]).toEqual({
      insideAlias: false,
      type: 'invoker',
      value: '$go',
    })
    expect(firstBlock.commands[1].tokens[1]).toEqual({
      insideAlias: false,
      type: 'cmd',
      value: 'play',
    })
    expect(firstBlock.commands[1].tokens[2]).toEqual({
      insideAlias: false,
      type: 'str',
      value: 'loona so what',
    })
  })

  function testParse(isStrict = false): AstParseResult {
    parser = new Parser(command, isStrict)

    return parser.result
  }
})
