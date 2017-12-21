import { Disposable } from 'atom'
import * as childProcess from 'child_process'
const commandJoin = require('command-join')
import * as fs from 'fs'

export type OpenerFeature = 'dvi' | 'pdf' | 'ps' | 'sync' | 'background'

const VARIABLE_PATTERN: RegExp = /\$\{?(\w+)\}?/g

export abstract class Opener extends Disposable {
  abstract open (filePath: string, texPath: string, lineNumber: number): Promise<void>

  abstract isAvailable (): Promise<boolean>

  abstract get name (): string

  abstract get features (): OpenerFeature[]

  get openInBackground (): boolean {
    return !!atom.config.get('latex-omnibus.open.openInBackground')
  }

  canExecute (filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.access(filePath, fs.constants.X_OK, err => resolve(!!err))
    })
  }

  execute (args: string[], options = {}): Promise<object> {
    return new Promise((resolve, reject) => {
      childProcess.exec(commandJoin(args), this.constructProcessOptions(), (error, stdout, stderr) => {
        if (error) {
          reject(error)
        } else {
          resolve({ stdout, stderr })
        }
      })
    })
  }

  constructProcessOptions (): object {
    const processOptions = {
      env: Object.assign({}, process.env),
      shell: true
    }
    const pathSetting: string = atom.config.get('latex-omnibus.build.$PATH')

    if (pathSetting) {
      processOptions.env[process.platform === 'win32' ? 'Path' : 'PATH'] =
        pathSetting.replace(VARIABLE_PATTERN, (match, name) => process.env[name] || match[0])
    }

    return processOptions
  }
}
