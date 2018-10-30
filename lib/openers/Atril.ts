import { OpenerFeature } from '../Opener'
import { default as Evince, DBusNames } from './Evince'

export default class AtrilOpener extends Evince {
  dbusNames: DBusNames = {
    applicationObject: ['/org/mate/atril/Atril'],
    applicationInterface: 'org.mate.atril.Application',

    daemonService: 'org.mate.atril.Daemon',
    daemonObject: ['/org/mate/atril/Daemon'],
    daemonInterface: 'org.mate.atril.Daemon',

    windowInterface: 'org.mate.atril.Window',

    fdApplicationObject: ['/org/gtk/Application/anonymous'],
    fdApplicationInterface: 'org.freedesktop.Application'
  }

  get name (): string {
    return 'atril'
  }

  get features (): OpenerFeature[] {
    return ['dvi', 'pdf', 'ps', 'sync']
  }
}
