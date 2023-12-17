import * as R from 'remeda'

import { ServerAPI } from 'decky-frontend-lib'
import { GameInfo } from './GameInfo'
import { useState } from 'react'

export const addShortcut = async ({
  name,
  target,
  cwd,
  launchOptions,
  cover,
  wideCover,
}: {
  name: string
  target: string
  cwd: string
  launchOptions: string
  cover: string | undefined
  wideCover: string | undefined
}) => {
  const appid = await SteamClient.Apps.AddShortcut(name, target, cwd, launchOptions)

  // The above is broken we need to set launch options and name manually
  await SteamClient.Apps.SetShortcutLaunchOptions(appid, launchOptions)
  await SteamClient.Apps.SetShortcutName(appid, name)

  if (cover) {
    await SteamClient.Apps.SetCustomArtworkForApp(appid, cover, 'jpg', 0)
  }

  if (wideCover) {
    await SteamClient.Apps.SetCustomArtworkForApp(appid, wideCover, 'jpg', 1)
    await SteamClient.Apps.SetCustomArtworkForApp(appid, wideCover, 'jpg', 3)
  }

  return appid
}

const useAPI = (serverAPI: ServerAPI) => {
  const [isAuthenticated, setAuthenticated] = useState<boolean | null>(null)

  const callPluginMethod = async <TRes = null, TArgs = {}>(method: string, args: TArgs) => {
    const response = await serverAPI.callPluginMethod<TArgs, TRes>(method, args)
    if (!response.success) throw response.result

    return response.result
  }

  const internal = {
    login: () => callPluginMethod<boolean | 'No saved credentials'>('login', {}),

    invalidateUserdata: () => callPluginMethod('invalidate_userdata', {}),

    authCode: (code: string) => callPluginMethod<boolean, { code: string }>('auth_code', { code }),

    syncLibrary: () =>
      callPluginMethod<Array<GameInfo>>('sync_library', {
        appidList: Array.from((window as any).collectionStore.deckDesktopApps.apps.keys()),
      }),

    updateAppidMap: (value: { [index: string]: string }) =>
      callPluginMethod<null, { value: { [index: string]: string } }>('update_appid_map', { value }),

    getAppidMap: () => callPluginMethod<{ [index: string]: string }>('get_appid_map', {}),

    getExec: () => callPluginMethod<string>('get_exec', {}),

    download: (url: string) => callPluginMethod<string, { url: string }>('download_as_base64', { url }),
  }

  const api = {
    login: async (code?: string) => {
      if (code) {
        await internal.authCode(code)
      }

      try {
        const result = await internal.login()

        setAuthenticated(result === true)
      } catch (e) {
        console.error('Error logging in', e)

        setAuthenticated(false)
      }
    },

    logout: () => {
      internal.invalidateUserdata()
      api.login()
    },

    isAuthenticated,

    addGame: async (game: GameInfo) => {
      const exec = await internal.getExec()
      const coverUrl = R.find(game.metadata.keyImages, (i) => i.type === 'DieselGameBoxTall')?.url
      const wideCoverUrl = R.find(game.metadata.keyImages, (i) => i.type === 'DieselGameBox')?.url

      const appid = await addShortcut({
        name: game.app_title,
        target: `${exec} launch ${game.app_name}`,
        cwd: '/usr/bin',
        launchOptions: '',
        cover: coverUrl ? await internal.download(coverUrl) : undefined,
        wideCover: wideCoverUrl ? await internal.download(wideCoverUrl) : undefined,
      })

      return appid
    },

    syncLibrary: async () => {
      const gameList = await internal.syncLibrary()

      const appidMap = R.zipObj(R.map(gameList, R.prop('app_name')), await Promise.all(R.map(gameList, api.addGame)))

      console.debug('GAME LIST', gameList, appidMap)

      internal.updateAppidMap(appidMap)
    },

    clearLibrary: async () => {
      const appidMap = await internal.getAppidMap()

      console.debug('REMOVE', appidMap)

      await Promise.all(
        R.pipe(
          R.values(appidMap),
          R.map((appid) => SteamClient.Apps.RemoveShortcut(appid)),
        ),
      )
    },
  }

  return api
}

export default useAPI
