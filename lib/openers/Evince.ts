import { TextEditor } from 'atom'
import { EventEmitter } from 'events'
import * as url from 'url'

import { Opener, OpenerFeature } from '../Opener'

export interface DBusNames {
  applicationObject: string[],
  applicationInterface: string,

  daemonService: string,
  daemonObject: string[],
  daemonInterface: string,

  windowInterface: string,

  fdApplicationObject?: string[],
  fdApplicationInterface?: string
}

interface EvinceDaemon {
  RegisterDocument (uri: string, callback: (error: any, owner: string) => void): void
  UnregisterDocument (uri: string, callback: (error: any) => void): void
  FindDocument (uri: string, spawn: boolean, callback: (error: any, owner: string) => void): void
}

interface EvinceApplication {
  Reload (args: { [ name: string ]: any }, timestamp: number, callback: (error: any) => void): void
  GetWindowList (callback: (error: any, windows: string[]) => void): void
}

interface EvinceWindow extends EventEmitter {
  SyncView (sourceFile: string, sourcePoint: [number, number], timestamp: number, callback: (error: any) => void): void
  on (signal: 'SyncSource', callback: (sourceFile: string, sourcePoint: [number, number], timestamp: number) => void): this
  on (signal: 'Closed', callback: () => void): this
  on (signal: 'DocumentLoaded', callback: (uri: string) => void): this
}

interface FreeDesktopApplication {
  Activate (platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
  ActivateAction (actionName: string, parameter: string[], platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
  Open (uris: string[], platformData: { [ name: string ]: any }, callback?: (error: any) => void): void
}

interface WindowInstance {
  evinceWindow: EvinceWindow
  onClosed: () => void,
  fdApplication?: FreeDesktopApplication
}

function syncSource (uri: string, point: [number, number]) {
  const filePath = decodeURI(url.parse(uri).pathname || '')
  atom.focus()
  atom.workspace.open(filePath).then(editor => (editor as TextEditor).setCursorBufferPosition(point))
}

export default class Evince extends Opener {
  windows: Map<string, WindowInstance> = new Map<string, WindowInstance>()
  dbusNames: DBusNames = {
    applicationObject: ['/org/gnome/evince/Evince'],
    applicationInterface: 'org.gnome.evince.Application',

    daemonService: 'org.gnome.evince.Daemon',
    daemonObject: ['/org/gnome/evince/Daemon'],
    daemonInterface: 'org.gnome.evince.Daemon',

    windowInterface: 'org.gnome.evince.Window',

    fdApplicationObject: ['/org/gtk/Application/anonymous', '/org/gnome/Evince'],
    fdApplicationInterface: 'org.freedesktop.Application'
  }
  bus: any
  daemon: EvinceDaemon

  constructor () {
    super(() => {
      for (const filePath of Array.from(this.windows.keys())) {
        this.disposeWindow(filePath)
      }
    })
  }

  async isAvailable (): Promise<boolean> {
    if (process.platform === 'linux') {
      const dbus = require('dbus-native')
      this.bus = dbus.sessionBus()
      this.daemon = await this.findInterface(this.dbusNames.daemonService, this.dbusNames.daemonObject, this.dbusNames.daemonInterface)
    }

    return !!this.daemon
  }

  get name (): string {
    return 'evince'
  }

  get features (): OpenerFeature[] {
    return ['dvi', 'pdf', 'ps', 'sync', 'background']
  }

  async getWindow (filePath: string, sourcePath: string): Promise<WindowInstance> {
    let windowInstance: WindowInstance | undefined = this.windows.get(filePath)

    if (windowInstance) return windowInstance

    // First find the internal document name
    const documentName = await this.findDocument(filePath)

    // Get the application interface and get the window list of the application
    const evinceApplication: EvinceApplication = await this.findInterface(documentName, this.dbusNames.applicationObject, this.dbusNames.applicationInterface)
    const windowNames: string[] = await this.getWindowList(evinceApplication)

    // Get the window interface of the of the first (only) window
    const onClosed = () => this.disposeWindow(filePath)
    windowInstance = {
      evinceWindow: await this.findInterface(documentName, windowNames, this.dbusNames.windowInterface),
      onClosed
    }

    if (this.dbusNames.fdApplicationObject && this.dbusNames.fdApplicationInterface) {
      // Get the GTK/FreeDesktop application interface so we can activate the window
      windowInstance.fdApplication = await this.findInterface(documentName, this.dbusNames.fdApplicationObject, this.dbusNames.fdApplicationInterface)
    }

    windowInstance.evinceWindow.on('SyncSource', syncSource)
    windowInstance.evinceWindow.on('Closed', windowInstance.onClosed)
    this.windows.set(filePath, windowInstance)

    // This seems to help with future syncs
    await this.syncView(windowInstance.evinceWindow, sourcePath, [0, 0], 0)

    return windowInstance
  }

  disposeWindow (filePath: string): void {
    const windowInstance = this.windows.get(filePath)
    if (windowInstance) {
      windowInstance.evinceWindow.removeListener('SyncSource', syncSource)
      windowInstance.evinceWindow.removeListener('Closed', windowInstance.onClosed)
      this.windows.delete(filePath)
    }
  }

  async open (filePath: string, sourcePath: string, line: number): Promise<void> {
    const windowInstance = await this.getWindow(filePath, sourcePath)
    if (!this.openInBackground && windowInstance.fdApplication) {
      windowInstance.fdApplication.Activate({})
    }

    // SyncView seems to want to activate the window sometimes
    await this.syncView(windowInstance.evinceWindow, sourcePath, [line, 0], 0)
  }

  getInterface (serviceName: string, objectPath: string, interfaceName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bus.getInterface(serviceName, objectPath, interfaceName, (error: any, interfaceInstance: any) => {
        if (error) {
          resolve()
        } else {
          resolve(interfaceInstance)
        }
      })
    })
  }

  async findInterface (serviceName: string, objectPaths: string[], interfaceName: string): Promise<any> {
    for (const objectPath of objectPaths) {
      const iface = await this.getInterface(serviceName, objectPath, interfaceName)
      if (iface) return iface
    }
  }

  getWindowList (evinceApplication: EvinceApplication): Promise<string[]> {
    return new Promise((resolve, reject) => {
      evinceApplication.GetWindowList((error, windowNames) => {
        if (error) {
          reject(error)
        } else {
          resolve(windowNames)
        }
      })
    })
  }

  syncView (evinceWindow: EvinceWindow, source: string, point: [number, number], timestamp: number): Promise<void> {
    return new Promise((resolve, reject) => {
      evinceWindow.SyncView(source, point, timestamp, (error) => {
        if (error) {
          reject(error)
        } else {
          resolve()
        }
      })
    })
  }

  findDocument (filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uri = url.format({
        protocol: 'file:',
        slashes: true,
        pathname: encodeURI(filePath)
      })

      this.daemon.FindDocument(uri, true, (error, documentName) => {
        if (error) {
          reject(error)
        } else {
          resolve(documentName)
        }
      })
    })
  }
}
