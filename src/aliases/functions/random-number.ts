import { AAliasFunction, AliasFunctionType } from './index'

export class RandomIntFunction extends AAliasFunction {
  private min: number
  private max: number

  private static startKey = ':randomNum['
  private static endKey = ']'

  public static signature = /:randomNum\[(?:\d+-{0,1})+\]+/

  public type: AliasFunctionType = AliasFunctionType.RandomNumber

  constructor(evalString: string) {
    super(evalString)

    const values = evalString
      .slice(evalString.indexOf('[') + 1, evalString.indexOf(']'))
      .split('-')

    if (values.length !== 2) {
      throw new Error(
        'Cannot use :randomNum with no provided numbers formatted start-end'
      )
    }

    this.min = parseInt(values[0], 10)
    this.max = parseInt(values[1], 10)
  }

  run(): string {
    return Math.floor(
      Math.random() * (this.max - this.min + 1) + this.min
    ).toString()
  }

  static parseMatches(
    str: string,
    results: RandomIntFunction[]
  ): RandomIntFunction[] {
    const firstIndex = str.indexOf(RandomIntFunction.startKey)

    if (firstIndex < 0) {
      return results
    }

    const slice1 = str.slice(
      firstIndex,
      str.indexOf(RandomIntFunction.endKey, firstIndex) + 1
    )
    results.push(new RandomIntFunction(slice1))

    return this.parseMatches(str.replace(slice1, ''), results)
  }
}
