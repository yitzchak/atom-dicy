import Nexus from './Nexus'

let nexus: Nexus | null

export function activate () {
  nexus = new Nexus()
  return nexus.initialize(false)
}

export function deactivate () {
  if (nexus) {
    nexus.dispose()
    nexus = null
  }
}

export function consumeBusySignal (service: any) {
  if (nexus) return nexus.consumeBusySignal(service)
}

export function consumeLinterIndie (registerIndie: any) {
  if (nexus) return nexus.consumeLinterIndie(registerIndie)
}
