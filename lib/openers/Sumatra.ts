import { Opener, OpenerFeature } from '../Opener'

export default class Sumatra extends Opener {
  executablePath: string
  candidatePaths: string[] = [
    'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe',
    'C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe'
  ]

  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    const atomPath = process.argv[0]

    await this.execute([
      this.executablePath,
      '-reuse-instance',
      '-forward-search',
      sourcePath,
      line.toString(),
      '-inverse-search',
      `${atomPath}" "%f:%l"`,
      filePath
    ])
  }

  async isAvailable (): Promise<boolean> {
    delete this.executablePath

    if (process.platform !== 'win32') return false

    for (const candidatePath of this.candidatePaths) {
      if (await this.canExecute(candidatePath)) {
        this.executablePath = candidatePath
        return true
      }
    }

    return false
  }

  get name (): string {
    return 'sumatra'
  }

  get features (): OpenerFeature[] {
    return ['pdf', 'sync']
  }
}
