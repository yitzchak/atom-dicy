import { Opener, OpenerFeature } from '../Opener'

export default class Preview extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    const args: string[] = ['open']

    if (this.openInBackground) {
      args.push('-g')
    }

    args.push('-a', 'Preview.app', filePath)

    await this.execute(args)
  }

  async isAvailable (): Promise<boolean> {
    return process.platform === 'darwin'
  }

  get name (): string {
    return 'preview'
  }

  get features (): OpenerFeature[] {
    return ['pdf', 'ps', 'background']
  }
}
