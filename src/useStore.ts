import { ServerAPI } from 'decky-frontend-lib'
import { create } from 'zustand'
import * as R from 'remeda'
import { diff } from 'deep-object-diff'

import { GameInfo } from './GameInfo'

export enum GameStatus {
  downloading = 7,
  uninstalled = 9,
  ready = 11,
  queued = 23,
}

type GameState = {
  epicName: string
  display_status: GameStatus
  bytes_downloaded: number
  bytes_total: number
}

type State = {
  serverAPI: ServerAPI | undefined
  isAuthenticated: boolean
  games: {
    [appid: number]: GameState
  }
}

export const useStore = create<State>()(() => ({
  serverAPI: undefined,
  isAuthenticated: false,
  games: {},
}))

useStore.subscribe((state, prevState) => console.debug('STORE UPDATE', diff(prevState, state)))

const callPluginMethod = async <TRes = null, TArgs = {}>(method: string, args: TArgs) => {
  const { serverAPI } = useStore.getState()

  if (serverAPI === undefined) {
    throw Error('Illegal state: "serverAPI" not set.')
  }

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

  updateAppidMap: (value: { [index: string]: number }) =>
    callPluginMethod<null, { value: { [index: string]: number } }>('update_appid_map', { value }),

  getAppidMap: () => callPluginMethod<{ [index: string]: number }>('get_appid_map', {}),

  getExec: () => callPluginMethod<string>('get_exec', {}),

  download: (url: string) => callPluginMethod<string, { url: string }>('download_as_base64', { url }),
}

if (SteamClient.Installs.OpenInstallWizard.__original === undefined) {
  SteamClient.Installs.OpenInstallWizard.__original = SteamClient.Installs.OpenInstallWizard
}

SteamClient.Installs.OpenInstallWizard = function (appidList: Array<number>) {
  const { games } = useStore.getState()

  const filteredList = R.reject(appidList, (appid) => games[appid] === undefined)

  if (R.isEmpty(filteredList)) {
    return SteamClient.Installs.OpenInstallWizard.__original.call(this, ...arguments)
  }

  R.forEach(filteredList, installGame)
}

export const setServerAPI = (serverAPI: ServerAPI) => useStore.setState(() => ({ serverAPI }))

export const signIn = async (code?: string) => {
  if (code) {
    await internal.authCode(code)
  }

  try {
    const result = await internal.login()

    useStore.setState(() => ({ isAuthenticated: result === true }))
  } catch (e) {
    console.error('Error signing in', e)

    useStore.setState(() => ({ isAuthenticated: false }))
  }
}

export const signOut = async () => {
  await internal.invalidateUserdata()

  return signIn()
}

export const initGames = async (apps?: { [name: string]: number }) => {
  const _apps = apps ?? (await internal.getAppidMap())

  useStore.setState((state) => ({
    games: {
      ...state.games,
      ...R.pipe(
        _apps,
        R.toPairs,
        R.mapToObj(([epicName, appid]) => [
          appid,
          {
            epicName,
            display_status: GameStatus.uninstalled,
            bytes_downloaded: 0,
            bytes_total: 0,
          },
        ]),
      ),
    },
  }))
}

const addShortcut = async ({
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
  const appid: number = await SteamClient.Apps.AddShortcut(name, target, cwd, launchOptions)

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

const addGame = async (game: GameInfo) => {
  try {
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
  } catch (e) {
    console.error('Error adding game', game.app_title, game.app_name, e)

    return null
  }
}

export const syncLibrary = async () => {
  const gameList = await internal.syncLibrary()

  const appidMap = R.zipObj(R.map(gameList, R.prop('app_name')), R.compact(await Promise.all(R.map(gameList, addGame))))

  internal.updateAppidMap(appidMap)
  initGames(appidMap)
}

export const clearLibrary = async () => {
  const { games } = useStore.getState()

  await Promise.all(
    R.pipe(
      R.keys(games),
      R.map((appid) => SteamClient.Apps.RemoveShortcut(appid)),
    ),
  )

  await internal.updateAppidMap({})
  useStore.setState(() => ({ games: {} }))
}

export const updateGameOverview = (appid: number, game: Partial<GameState>) => {
  useStore.setState((s) =>
    R.mergeDeep(s, {
      games: { [appid]: game as GameState },
    }),
  )

  patchGameOverview(appid)
}

export const patchGameOverview = (appid: number) => {
  const game = useStore.getState().games[appid]

  Object.assign((window as any).collectionStore.allAppsCollection.apps.get(appid).local_per_client_data, {
    installed: game.display_status !== GameStatus.ready,
    display_status: game.display_status,
    bytes_downloaded: game.bytes_downloaded.toString(),
    bytes_total: game.bytes_total.toString(),
    status_percentage: (game.bytes_downloaded / game.bytes_total) * 100,
  })
}

export const installGame = (appid: number) => {
  updateGameOverview(appid, {
    display_status: GameStatus.downloading,
    bytes_downloaded: 0,
    bytes_total: 10000000000,
  })

  const tick = () => {
    const game = useStore.getState().games[appid]

    if (game.bytes_downloaded >= game.bytes_total) {
      updateGameOverview(appid, {
        display_status: GameStatus.ready,
      })
    } else {
      updateGameOverview(appid, {
        display_status: GameStatus.queued,
        bytes_downloaded: game.bytes_downloaded + game.bytes_total / 100,
      })

      setTimeout(tick, 1000)
    }
  }

  setTimeout(tick, 1000)

  console.debug('DOWNLOAD', appid)
}
