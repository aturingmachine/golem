import { shuffleArray } from './list-utils'

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
    return shuffleArray(affirmative).pop() || ''
  }

  static get neutral(): string {
    return shuffleArray(neutral).pop() || ''
  }

  static get negative(): string {
    return shuffleArray(negative).pop() || ''
  }
}
