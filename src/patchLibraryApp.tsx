import { ServerAPI, useParams } from 'decky-frontend-lib'
import { FC, PropsWithChildren } from 'react'

import { patchGameOverview } from './useStore'

const GamePatch: FC<PropsWithChildren<{}>> = ({ children }) => {
  const { appid: _appid } = useParams<{ appid: string }>()
  const appid = parseInt(_appid)

  patchGameOverview(appid)

  setTimeout(() => patchGameOverview(appid), 100)

  return <>{children}</>
}

const patchLibraryApp = (serverAPI: ServerAPI) => {
  return serverAPI.routerHook.addPatch('/library/app/:appid', (props) => ({
    ...props,
    children: <GamePatch>{props?.children}</GamePatch>,
  }))
}

export default patchLibraryApp
