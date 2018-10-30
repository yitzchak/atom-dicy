import { CompositeDisposable, Disposable, TextEditor } from 'atom'
import { Command, DiCy, Message, OptionsSource } from '@dicy/client'
const fileUrl = require('file-url')
import * as _ from 'lodash'
import * as path from 'path'
import * as readdir from 'readdir-enhanced'
const url2path = require('file-uri-to-path')

import { Opener, OpenerFeature } from './Opener'

const SCOPE_PATTERN = /^(text\.tex(?:\.latex|\.latex\.knitr|\.latex\.haskell|\.latex\.agda)?|source.pweave.latex)$/

function editorIsLaTeX (editor: TextEditor | undefined): boolean {
  return !!editor && SCOPE_PATTERN.test(editor.getRootScopeDescriptor().getScopesArray().join(''))
}

interface FileDetails {
  root: string
  file: string
  line: number
}

interface RunDiCyOptions {
  busyText?: string
  clearMessages?: boolean
  options?: OptionsSource
  openTargets?: boolean
}

const ROOT_MAGIC_PATTERN = /^%\s*!T[eE]X\s+root\s*=\s*(.*?)\s*$/gm

const DVI_PATTERN = /\.(?:dvi|xdv)$/i
const PDF_PATTERN = /\.pdf$/i
const PS_PATTERN = /\.ps$/i
const SYNCTEX_PATTERN = /\.synctex(?:\.gz)?$/i

export default class Nexus extends Disposable {
  disposables: CompositeDisposable = new CompositeDisposable()
  dicy: DiCy = new DiCy(true)
  updateDiCyUserOptions: boolean = true
  busyService: any
  linter: any
  messages: Map<string, Message[]> = new Map<string, Message[]>()
  openers: Opener[] = []

  constructor () {
    super(() => this.disposables.dispose())

    this.disposables.add(
      // Add our commands
      atom.commands.add('atom-workspace', {
        'dicy:build': this.build.bind(this),
        'dicy:clean': this.clean.bind(this),
        'dicy:initialize': this.initialize.bind(this),
        'dicy:kill': this.kill.bind(this),
        'dicy:open': this.open.bind(this),
        'dicy:scrub': this.scrub.bind(this)
      }),
      // Add a disposable for the DiCy client
      new Disposable(() => this.dicy.destroy()),
      // Observe the text editors so we can attach to the save event.
      atom.workspace.observeTextEditors(editor => {
        if (editorIsLaTeX(editor)) {
          this.disposables.add(editor.onDidSave(() => {
            const activeEditor = atom.workspace.getActiveTextEditor()
            if (editor === activeEditor && this.buildAfterSave) {
              this.build()
            }
          }))
          let inProgress = false
          this.disposables.add(editor.onDidChangeCursorPosition(() => {
            const activeEditor = atom.workspace.getActiveTextEditor()
            if (!inProgress && editor === activeEditor && this.openAfterChangeCursonPosition) {
              inProgress = true
              this.open(false).then(() => { inProgress = false })
            }
          }))
        }
      }),
      // If settings are changed in the build group then tell DiCy.
      atom.config.onDidChange('dicy.build', () => {
        this.updateDiCyUserOptions = true
      })
    )

    this.dicy.on('log', this.addMessages.bind(this))

    this.initialize(false)
  }

  clearMessages (file: string) {
    let messages: Message[] | undefined = this.messages.get(file)

    if (messages && this.linter) {
      const files: Set<string> = new Set<string>(messages.map(message => message.source ? message.source.file : file))

      for (const uri of files.values()) {
        this.linter.clearMessages(url2path(uri))
      }
    }

    this.messages.delete(file)
  }

  addMessages (file: string, newMessages: Message[]) {
    let messages: Message[] | undefined = this.messages.get(file)

    messages = (messages || []).concat(newMessages)
    this.messages.set(file, messages)

    if (this.linter) {
      const linterMessages: Map<string, object[]> = new Map<string, object[]>()

      for (const message of messages) {
        const nameText = message.name ? `[${message.name}] ` : ''
        const typeText = message.category ? `${message.category}: ` : ''
        const filePath: string = url2path(message.source ? message.source.file : file)
        const linterMessage: any = {
          severity: message.severity,
          excerpt: `${nameText}${typeText}${message.text}`,
          location: {
            file: filePath,
            position: message.source && message.source.range
              ? [[message.source.range.start - 1, 0], [message.source.range.end - 1, Number.MAX_SAFE_INTEGER]]
              : [[0, 0], [0, 1]]
          }
        }

        if (message.log) {
          linterMessage.reference = {
            file: url2path(message.log.file)
          }
          if (message.log.range) {
            linterMessage.reference.position = [message.log.range.start - 1, 0]
          }
        }

        const o = linterMessages.get(filePath) || []
        o.push(linterMessage)
        linterMessages.set(filePath, o)
      }

      for (const [filePath, m] of linterMessages.entries()) {
        this.linter.setMessages(filePath, m)
      }
    }
  }

  async initialize (showStatus: boolean = true): Promise<void> {
    this.openers = []

    const openerClassPath: string = path.join(__dirname, 'openers')
    for (const entry of await readdir.async(openerClassPath)) {
      const OpenerImpl = require(path.join(openerClassPath, entry)).default
      const openerInstance = new OpenerImpl()
      if (await openerInstance.isAvailable()) {
        this.openers.push(openerInstance)
        this.disposables.add(openerInstance)
      } else {
        openerInstance.dispose()
      }
    }

    this.openers = _.orderBy(this.openers,
      [(opener: Opener) => opener.features.includes('sync'), (opener: Opener) => opener.features.includes('sync')],
      ['desc', 'desc'])

    if (showStatus) {
      this.info('DiCy Initialize', `# Openers\n${this.openers.map(opener => `- ${opener.name} — ${opener.features.join(', ')}`).join('\n')}`)
    }
  }

  async openFile (filePath: string, sourcePath: string, line: number): Promise<void> {
    const opener: Opener | undefined = this.findOpener(filePath)

    if (opener) {
      await opener.open(filePath, sourcePath, line)
    } else {
      this.warning(`No opener found that can open ${filePath}.`)
    }
  }

  getCandidateOpeners (filePath: string): Opener[] {
    let type: OpenerFeature

    if (PDF_PATTERN.test(filePath)) {
      type = 'pdf'
    } else if (PS_PATTERN.test(filePath)) {
      type = 'ps'
    } else if (DVI_PATTERN.test(filePath)) {
      type = 'dvi'
    } else {
      return []
    }

    return this.openers.filter(opener => opener.features.includes(type))
  }

  findOpener (filePath: string): Opener | undefined {
    const name: string = this.opener
    const candidates: Opener[] = this.getCandidateOpeners(filePath)

    if (!candidates.length) return

    let opener: Opener | undefined

    if (name !== 'automatic') {
      opener = candidates.find(opener => opener.name === name)
      if (opener) return opener
    }

    if (this.synctex) {
      // If the user wants openTargetsInBackground also and there is an opener
      // that supports that and SyncTeX it will be the first one because of
      // the priority sort.
      opener = candidates.find(opener => opener.features.includes('sync'))
      if (opener) return opener
    }

    if (this.openInBackground) {
      opener = candidates.find(opener => opener.features.includes('background'))
      if (opener) return opener
    }

    return candidates[0]
  }

  async initializeDiCy (options?: OptionsSource): Promise<FileDetails | undefined> {
    const editor: TextEditor | undefined = atom.workspace.getActiveTextEditor()

    if (!editor) return

    const source: string | undefined = editor.getPath()

    if (!source) {
      this.warning('File needs to be saved before it can be processed by DiCy.')
      return
    }

    let file: string = source

    if (!editorIsLaTeX(editor)) {
      this.warning('File does not have a grammar that can be processed by DiCy.')
      return
    }

    const position = editor.getCursorBufferPosition()
    const line = position.row + 1

    editor.scan(ROOT_MAGIC_PATTERN, params => {
      file = path.resolve(path.dirname(file), params.match[1])
      params.stop()
    })

    const root: string = fileUrl(file)

    if (options) {
      await this.dicy.setInstanceOptions(root, options)
    }

    if (this.updateDiCyUserOptions) {
      // Update the options on this builder. This will set the options the
      // user's config file. All other builders will then reread the config file
      // on their next build.
      await this.dicy.setUserOptions(root, this.getDiCyOptions(), true)
      this.updateDiCyUserOptions = false
    }

    return { root, file, line }
  }

  getDiCyOptions (): OptionsSource {
    return atom.config.get('dicy.build')
  }

  async runDiCy (commands: Command[], runOptions: RunDiCyOptions = {}) {
    const details: FileDetails | undefined = await this.initializeDiCy(runOptions.options)

    if (details) {
      let busy: any
      let success: boolean = true

      if (this.busyService && runOptions.busyText) {
        busy = this.busyService.reportBusy(`Running ${runOptions.busyText} command on ${details.root}`)
      }

      if (runOptions.clearMessages) {
        this.clearMessages(details.root)
      }

      if (commands.length > 0) {
        success = await this.dicy.run(details.root, commands)
      }

      if (success && runOptions.openTargets) {
        const targets = await this.dicy.getTargets(details.root)
        for (const target of targets) {
          if (!SYNCTEX_PATTERN.test(target)) {
            await this.openFile(url2path(target), details.file, details.line)
          }
        }
      }

      if (busy) busy.dispose()
    }
  }

  build (): Promise<void> {
    return this.runDiCy(['load', 'build', 'log', 'save'], {
      busyText: 'build',
      clearMessages: true,
      openTargets: this.openAfterBuild,
      options: {
        severity: 'info'
      }
    })
  }

  clean (): Promise<void> {
    return this.runDiCy(['load', 'clean', 'save'], {
      busyText: 'clean',
      clearMessages: true,
      options: {
        severity: 'info'
      }
    })
  }

  scrub (): Promise<void> {
    return this.runDiCy(['load', 'scrub', 'save'], {
      busyText: 'scrub',
      clearMessages: true,
      options: {
        severity: 'info'
      }
    })
  }

  open (load: boolean = true): Promise<void> {
    return this.runDiCy(load ? ['load'] : [], {
      openTargets: true
    })
  }

  async kill (): Promise<void> {
    const details: FileDetails | undefined = await this.initializeDiCy()

    if (details) await this.dicy.kill(details.root)
  }

  /** Show an informational notification. */
  info (message: string, description?: string) {
    atom.notifications.addInfo(message, { description })
  }

  /** Show a warning notification. */
  warning (message: string, description?: string) {
    atom.notifications.addWarning(message, { description })
  }

  /** Show an error notification. */
  error (message: string, description?: string) {
    atom.notifications.addError(message, { description })
  }

  consumeBusySignal (service: any): Disposable {
    this.busyService = service
    const disposable = new Disposable(() => {
      delete this.busyService
    })
    this.disposables.add(disposable)

    return disposable
  }

  consumeLinterIndie (registerIndie: any): Disposable {
    this.linter = registerIndie({ name: 'DiCy' })
    this.disposables.add(this.linter)

    return this.linter
  }

  get buildAfterSave (): boolean {
    return !!atom.config.get('dicy.event.buildAfterSave')
  }

  get openAfterBuild (): boolean {
    return !!atom.config.get('dicy.event.openAfterBuild')
  }

  get openAfterChangeCursonPosition (): boolean {
    return !!atom.config.get('dicy.event.openAfterChangeCursonPosition')
  }

  get opener (): string {
    return atom.config.get('dicy.open.opener')
  }

  get openInBackground (): boolean {
    return !!atom.config.get('dicy.open.openInBackground')
  }

  get synctex (): boolean {
    return !!atom.config.get('dicy.build.synctex')
  }
}
