import {
  ButtonItem,
  definePlugin,
  DialogButton,
  PanelSection,
  PanelSectionRow,
  Router,
  ServerAPI,
  staticClasses,
  TextField,
} from 'decky-frontend-lib'
import { FC, useEffect, useState } from 'react'
import { FaShip } from 'react-icons/fa'

import patchLibraryApp from './patchLibraryApp'
import { clearLibrary, initGames, setServerAPI, signIn, signOut, syncLibrary, useStore } from './useStore'

const Content: FC = () => {
  const isAuthenticated = useStore((s) => s.isAuthenticated)

  useEffect(() => {
    signIn()
  }, [])

  return (
    <PanelSection title="Epic Games">
      <PanelSectionRow>
        {isAuthenticated === null ?
          <ButtonItem layout="below" disabled>
            Loading...
          </ButtonItem>
        : isAuthenticated ?
          <ButtonItem layout="below" onClick={signOut}>
            Sign out
          </ButtonItem>
        : <ButtonItem
            layout="below"
            onClick={() => {
              Router.CloseSideMenus()
              Router.Navigate('/legendary-epic-login')
            }}
          >
            Sign in
          </ButtonItem>
        }
        <ButtonItem layout="below" disabled={!isAuthenticated} onClick={syncLibrary}>
          Sync library
        </ButtonItem>
        <ButtonItem layout="below" onClick={clearLibrary}>
          Clear library
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  )
}

const EpicLogin: FC = () => {
  const [code, setCode] = useState('')

  return (
    <div
      style={{
        height: '100%',
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: '1fr max-content',
        alignItems: 'center',
        margin: '40px',
      }}
    >
      <TextField label="Authorization code" focusOnMount value={code} onChange={(e) => setCode(e.target.value)} />
      <DialogButton onClick={() => signIn(code)}>Done</DialogButton>
    </div>
  )
}

export default definePlugin((serverAPI: ServerAPI) => {
  setServerAPI(serverAPI)
  initGames()

  serverAPI.routerHook.addRoute('/legendary-epic-login', () => <EpicLogin />, { exact: true })

  const libraryPatch = patchLibraryApp(serverAPI)

  return {
    title: <div className={staticClasses.Title}>epic-games-deck</div>,
    content: <Content />,
    icon: <FaShip />,
    onDismount() {
      serverAPI.routerHook.removeRoute('/legendary-epic-login')
      serverAPI.routerHook.removePatch('/library/app/:appid', libraryPatch)
    },
  }
})
