import { Replies } from './types'

export class Reply {
  children: Replies[] = []

  async add(child: Replies | Promise<Replies>): Promise<Replies[]> {
    this.children.push(await child)

    return this.children
  }

  // TODO Filter out uniques.
  render(): Replies[] {
    return this.children
  }
}
