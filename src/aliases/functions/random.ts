import { shuffleArray } from '../../utils/list-utils'
import { AAliasFunction, AliasFunctionType } from '.'

export class RandomAliasFunction extends AAliasFunction {
  private options: string[]

  private static startKey = ':random['
  private static endKey = ']'

  public static signature = /:random\[.+\]/

  public type: AliasFunctionType = AliasFunctionType.Random

  constructor(evalString: string) {
    super(evalString)

    this.options = evalString
      .slice(evalString.indexOf('[') + 1, evalString.indexOf(']'))
      .split(';')

    if (this.options.length === 0) {
      throw new Error('Cannot use :random with no options')
    }
  }

  run(): string {
    return shuffleArray(this.options).pop() || ''
  }

  static parseMatches(
    str: string,
    results: RandomAliasFunction[]
  ): RandomAliasFunction[] {
    const firstIndex = str.indexOf(RandomAliasFunction.startKey)

    if (firstIndex < 0) {
      return results
    }

    const slice1 = str.slice(
      firstIndex,
      str.indexOf(RandomAliasFunction.endKey) + 1
    )

    results.push(new RandomAliasFunction(slice1))

    return this.parseMatches(str.replace(slice1, ''), results)
  }
}
