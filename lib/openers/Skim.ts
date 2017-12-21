import { Opener, OpenerFeature } from '../Opener'

export default class SkimOpener extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    const script: string = `
set theLine to "${line}" as integer
set theFile to POSIX file "${filePath}"
set theSource to POSIX file "${sourcePath}"
set thePath to POSIX path of (theFile as alias)
tell application "Skim"
  if ${!this.openInBackground} then activate
  try
    set theDocs to get documents whose path is thePath
    if (count of theDocs) > 0 then revert theDocs
  end try
  open theFile
  tell front document to go to TeX line theLine from theSource
end tell`

    await this.executeScript(script)
  }

  async isAvailable (): Promise<boolean> {
    if (process.platform !== 'darwin') return false

    try {
      const { stdout } = await this.executeScript('get version of application "Skim"')
      return !!stdout
    } catch (error) {
      return false
    }
  }

  get name (): string {
    return 'skim'
  }

  get features (): OpenerFeature[] {
    return ['dvi', 'pdf', 'ps', 'sync', 'background']
  }

  executeScript (script: string): Promise<any> {
    return this.execute(['osascript', '-e', script])
  }
}
