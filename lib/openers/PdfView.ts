import { Opener, OpenerFeature } from '../Opener'

export default class PdfView extends Opener {
  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    const sourcePane = atom.workspace.paneForURI(sourcePath)
    const previousActivePane = atom.workspace.getActivePane()

    // This prevents splitting the right pane multiple times
    if (sourcePane) {
      sourcePane.activate()
    }

    const options = {
      searchAllPanes: true,
      split: atom.config.get('latex-omnibus.open.pdfViewSplitDirection')
    }

    const item = await atom.workspace.open(filePath, options)
    if (item && item.forwardSync) {
      item.forwardSync(sourcePath, line)
    }

    if (previousActivePane && this.openInBackground) {
      previousActivePane.activate()
    }
  }

  async isAvailable (): Promise<boolean> {
    return atom.packages.isPackageActive('pdf-view')
  }

  get name (): string {
    return 'pdf-view'
  }

  get features (): OpenerFeature[] {
    return ['pdf', 'sync', 'background']
  }
}
