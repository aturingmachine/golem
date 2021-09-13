import readline from 'readline'
import { GolemBot } from '..'

export class Debugger {
  private rl: readline.Interface

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  openPrompt(): void {
    this.rl.question('\n>>> QUERY:\n', (ans) => {
      switch (ans.toLowerCase()) {
        case 'exit':
          break
        case 'kill':
          break
        default:
          GolemBot.trackFinder.search(ans)
      }
    })
  }

  private close(): void {
    this.rl.close()
  }
}
