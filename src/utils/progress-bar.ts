import { terminal, Terminal } from 'terminal-kit'

export class EzProgressBar {
  private static amount = 0
  private static bar?: Terminal.ProgressBarController

  static start(items?: number): void {
    if (!EzProgressBar.bar) {
      EzProgressBar.bar = terminal.progressBar({
        width: 100,
        percent: true,
        inline: true,
        items,
        barChar: '\u2588',
      })
    }
  }

  static add(value: number, title?: string): void {
    EzProgressBar.amount += value
    EzProgressBar.bar?.update({ progress: EzProgressBar.amount, title })
  }

  static stop(): void {
    EzProgressBar.bar?.stop()
    EzProgressBar.amount = 0
    EzProgressBar.bar = undefined
  }
}
