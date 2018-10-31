import { Opener, OpenerFeature } from '../Opener'

export default class XdgOpen extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    await this.execute(['xdg-open', filePath])
  }

  async isAvailable (): Promise<boolean> {
    return process.platform === 'linux'
  }

  get name (): string {
    return 'xdg-open'
  }

  get features (): OpenerFeature[] {
    return ['dvi', 'pdf', 'ps']
  }
}
