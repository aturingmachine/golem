export class InputStream {
  pos = 0
  commands = 0
  col = 0

  constructor(readonly input: string) {}

  remaining(): string {
    return this.input.slice(this.pos)
  }

  peek_next(): string {
    return this.input.charAt(this.pos + 1)
  }

  next(): string {
    const ch = this.input.charAt(this.pos++)

    if (ch === '\n') {
      this.commands++
      this.col = 0
    } else {
      this.col++
    }

    return ch
  }

  peek(): string {
    return this.input.charAt(this.pos)
  }

  eoc(): boolean {
    // console.log(this.peek(), this.peek_next())
    return (
      [';', '', null].includes(this.peek()) ||
      (this.peek() === '&' && this.peek_next() === '&')
    )
  }

  eof(): boolean {
    return this.peek() === ''
  }

  croak(msg: string): void {
    throw new Error(msg + ' (' + this.commands + ':' + this.col + ')')
  }
}
