import { OpenerFeature } from '../Opener'
import { default as Evince, DBusNames } from './Evince'

export default class XReader extends Evince {
  dbusNames: DBusNames = {
    applicationObject: '/org/x/reader/Xreader',
    applicationInterface: 'org.x.reader.Application',

    daemonService: 'org.x.reader.Daemon',
    daemonObject: '/org/x/reader/Daemon',
    daemonInterface: 'org.x.reader.Daemon',

    windowInterface: 'org.x.reader.Window',

    fdApplicationObject: '/org/gtk/Application/anonymous',
    fdApplicationInterface: 'org.freedesktop.Application'
  }

  get name (): string {
    return 'x-reader'
  }

  get features (): OpenerFeature[] {
    return ['dvi', 'pdf', 'ps', 'sync']
  }
}
