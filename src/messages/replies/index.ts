import { Replies } from './types'

export class Reply {
  children: Replies[] = []

  add(child: Replies): Replies[] {
    this.children.push(child)

    return this.children
  }

  // TODO Filter out uniques.
  render(): Replies[] {
    return this.children
  }
}
