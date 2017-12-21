import * as url from 'url'

import { Opener, OpenerFeature } from '../Opener'

export default class Okular extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    const args = [
      'okular',
      '--unique'
    ]

    if (this.openInBackground) {
      args.push('--noraise')
    }

    args.push(url.format({
      protocol: 'file:',
      slashes: true,
      pathname: encodeURI(filePath),
      hash: encodeURI(`src:${line} ${sourcePath}`)
    }))

    await this.execute(args)
  }

  async isAvailable (): Promise<boolean> {
    try {
      if (process.platform !== 'linux') return false
      await this.execute(['okular', '--version'])
    } catch (error) {
      return false
    }

    return true
  }

  get name (): string {
    return 'okular'
  }

  get features (): OpenerFeature[] {
    return ['dvi', 'pdf', 'ps', 'sync', 'background']
  }
}
