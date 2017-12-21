import { Opener, OpenerFeature } from '../Opener'

export default class SkimOpener extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    const script: string = `
set theLine to "${line}" as integer
set theFile to POSIX file "${filePath}"
set theSource to POSIX file "${sourcePath}"
set thePath to POSIX path of (theFile as alias)
tell application "${atom.config.get('latex-omnibus.open.skimPath')}"
  if ${!this.openInBackground} then activate
  try
    set theDocs to get documents whose path is thePath
    if (count of theDocs) > 0 then revert theDocs
  end try
  open theFile
  tell front document to go to TeX line theLine from theSource
end tell`

    await this.execute(['osascript', '-e', script])
  }

  async isAvailable (): Promise<boolean> {
    return process.platform === 'darwin' &&
      await this.canExecute(atom.config.get('latex-omnibus.open.skimPath'))
  }

  get name (): string {
    return 'skim'
  }

  get features (): OpenerFeature[] {
    return ['dvi', 'pdf', 'ps', 'sync', 'background']
  }
}
