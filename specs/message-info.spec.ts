import { Parser } from '../src/ast/parser'
import '../src/commands/register-commands'
import { CommandInvocation } from '../src/messages/message-info'
import { debugDump } from '../test-utils/debug-dump'

describe('Message Info', () => {
  describe('Command Invocation', () => {
    let source: string
    let invocation: CommandInvocation

    it('should use the command property as the command', () => {
      source = '$go play twice tt'

      createInvocation()

      expect(invocation.command).toEqual('play')
    })

    it('should populate the options dictionary with the options of the command', () => {
      source =
        '$go play twice tt --some_opt=a-string --another_opt=10 --bool --quote_opt="I can have spaces!"'

      createInvocation()

      expect(invocation.command).toEqual('play')
      expect(invocation.options).toEqual({
        some_opt: 'a-string',
        another_opt: 10,
        bool: true,
        quote_opt: 'I can have spaces!',
      })
    })

    describe('Variable Parsing', () => {
      it('should populate the variables dictionary with the variables in the command', () => {
        source = '$go play %song_name %another-var'

        createInvocation()

        expect(invocation.variables).toEqual({
          song_name: undefined,
          'another-var': undefined,
        })
      })

      it('should populate the variables dictionary using values from the options', () => {
        source =
          '$go play %song_name %another-var %missing_value --song_name="twice tt" --another-var=10'

        createInvocation()

        expect(invocation.variables).toEqual({
          missing_value: undefined,
          song_name: 'twice tt',
          'another-var': 10,
        })
      })

      it('should evaluate functions', () => {
        source = '$go play :[random(twice tt, loona so what)] --skip'

        createInvocation()
        debugDump(invocation)

        console.log(invocation.asRaw)

        // expect(invocation.variables).toEqual({
        //   missing_value: undefined,
        //   song_name: 'twice tt',
        //   'another-var': 10,
        // })
      })
    })

    fit('should evaluate functions for values', () => {
      source =
        '$go play %song_name --song_name=:[random(twice tt, loona so what)] --skip'

      createInvocation()
      debugDump(invocation)

      console.log(invocation.asRaw)

      expect(invocation.variables).toEqual({
        missing_value: undefined,
        song_name: 'twice tt',
        'another-var': 10,
      })
    })

    function createInvocation() {
      const parser = new Parser(source)

      invocation = new CommandInvocation(parser.result.blocks[0].commands[0])
    }
  })
})