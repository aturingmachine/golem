import { ArrayUtils } from './list-utils'

const affirmative = [
  'Hell Yeah',
  'Lets get it',
  "Fuckin' nice",
  'Sure thing',
  'You got it bud',
]

const neutral = ['Ok', 'Got it', 'Understood']

const negative = ['Oops...', 'Well shit', 'Oh boy...']

export class Replier {
  static get affirmative(): string {
    return ArrayUtils.shuffleArray(affirmative).pop() || ''
  }

  static get neutral(): string {
    return ArrayUtils.shuffleArray(neutral).pop() || ''
  }

  static get negative(): string {
    return ArrayUtils.shuffleArray(negative).pop() || ''
  }
}
