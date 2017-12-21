import { Opener, OpenerFeature } from '../Opener'

export default class ShellOpenOpener extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    await this.execute([filePath])
  }

  async isAvailable (): Promise<boolean> {
    return process.platform === 'win32'
  }

  get name (): string {
    return 'shell-open'
  }

  get features (): OpenerFeature[] {
    return ['dvi', 'pdf', 'ps']
  }
}
