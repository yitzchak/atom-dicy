import { Opener, OpenerFeature } from '../Opener'

export default class Qpdfview extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    await this.execute([
      'qpdfview',
      '--unique',
      `${filePath}#src:${sourcePath}:${line}:0`
    ])
  }

  async isAvailable (): Promise<boolean> {
    try {
      if (process.platform !== 'linux') return false
      await this.execute(['qpdfview', '--help'])
    } catch (error) {
      return false
    }

    return true
  }

  get name (): string {
    return 'qpdfview'
  }

  get features (): OpenerFeature[] {
    return ['pdf', 'ps', 'sync']
  }
}
