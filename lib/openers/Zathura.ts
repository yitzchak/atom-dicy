import { Opener, OpenerFeature } from '../Opener'

export default class Zathura extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    const atomPath = process.argv[0]

    await this.execute([
      'zathura',
      `--synctex-editor-command="${atomPath}" "%{input}:%{line}"`,
      `--synctex-forward=${line}:1:${sourcePath}`,
      filePath
    ])
  }

  async isAvailable (): Promise<boolean> {
    try {
      if (process.platform !== 'linux') return false
      await this.execute(['zathura', '--version'])
    } catch (error) {
      return false
    }

    return true
  }

  get name (): string {
    return 'zathura'
  }

  get features (): OpenerFeature[] {
    return ['pdf', 'ps', 'sync']
  }
}
