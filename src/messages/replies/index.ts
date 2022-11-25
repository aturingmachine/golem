import { Replies } from './types'

export class Reply {
  children: Replies[] = []

  async add(
    child: Replies | Promise<Replies> | (Replies | Promise<Replies>)[]
  ): Promise<Replies[]> {
    if (Array.isArray(child)) {
      for (const c of child) {
        this.children.push(await c)
      }
    } else {
      this.children.push(await child)
    }

    return this.children
  }

  // TODO Filter out uniques.
  render(): Replies[] {
    return this.children
  }
}
