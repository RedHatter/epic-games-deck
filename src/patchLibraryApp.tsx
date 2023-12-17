import { ServerAPI, useParams } from 'decky-frontend-lib'
import { FC, PropsWithChildren } from 'react'

import { GameStatus, useStore } from './useStore'

const GamePatch: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { appid: _appid } = useParams<{ appid: string }>()
  const appid = parseInt(_appid)

  const game = useStore((s) => s.games[appid])

  if (game !== undefined) {
    const overview = (window as any).collectionStore.allAppsCollection.apps.get(appid)
    Object.assign(overview.local_per_client_data, {
      installed: game.display_status !== GameStatus.ready,
      display_status: game.display_status,
      bytes_downloaded: game.bytes_downloaded.toString(),
      bytes_total: game.bytes_total.toString(),
      status_percentage: (game.bytes_downloaded / game.bytes_total) * 100,
    })

    console.debug('PATCH INFO', appid, overview)
  }

  return <>{children}</>
}

const patchLibraryApp = (serverAPI: ServerAPI) => {
  return serverAPI.routerHook.addPatch('/library/app/:appid', (props) => ({
    ...props,
    children: <GamePatch>{props?.children}</GamePatch>,
  }))
}

export default patchLibraryApp
