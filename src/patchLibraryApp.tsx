import { ServerAPI, useParams } from 'decky-frontend-lib'
import { FC, PropsWithChildren } from 'react'
import useAPI from './useAPI'

const GamePatch: FC<PropsWithChildren<{ serverAPI: ServerAPI }>> = ({ serverAPI, children }) => {
  const { appid } = useParams<{ appid: string }>()

  const api = useAPI(serverAPI)

  api.patchGame(parseInt(appid))

  return <>{children}</>
}

const patchLibraryApp = (serverAPI: ServerAPI) => {
  return serverAPI.routerHook.addPatch('/library/app/:appid', (props) => ({
    ...props,
    children: <GamePatch serverAPI={serverAPI}>{props?.children}</GamePatch>,
  }))
}

export default patchLibraryApp
