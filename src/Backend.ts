import { ServerAPI } from 'decky-frontend-lib'

type Game = {
  app_name: string
  app_title: string
}

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

  getGameList() {
    return this.#callPluginMethod<Array<Game>>('get_game_list', {})
  }
}
