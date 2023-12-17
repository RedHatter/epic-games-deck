import { ServerAPI } from 'decky-frontend-lib'
import { GameInfo } from './GameInfo'

export default class Backend {
  #serverAPI: ServerAPI

  constructor(serverAPI: ServerAPI) {
    this.#serverAPI = serverAPI
  }

  async #callPluginMethod<TRes = {}, TArgs = {}>(method: string, args: TArgs) {
    const response = await this.#serverAPI.callPluginMethod<TArgs, TRes>(method, args)
    if (!response.success) throw response.result

    return response.result
  }

  invalidateUserdata() {
    return this.#callPluginMethod<null>('invalidate_userdata', {})
  }

  authCode(code: string) {
    return this.#callPluginMethod<boolean, { code: string }>('auth_code', { code })
  }

  login() {
    return this.#callPluginMethod<boolean | 'No saved credentials'>('login', {})
  }

  syncLibrary() {
    return this.#callPluginMethod<Array<GameInfo>>('sync_library', {
      appidList: Array.from((window as any).collectionStore.deckDesktopApps.apps.keys()),
    })
  }

  updateAppidMap(value: { [index: string]: string }) {
    return this.#callPluginMethod<null, { value: { [index: string]: string } }>('update_appid_map', { value })
  }

  getAppidMap() {
    return this.#callPluginMethod<{ [index: string]: string }>('get_appid_map', {})
  }

  getExec() {
    return this.#callPluginMethod<string>('get_exec', {})
  }

  download(url: string) {
    return this.#callPluginMethod<string, { url: string }>('download_as_base64', { url })
  }
}
