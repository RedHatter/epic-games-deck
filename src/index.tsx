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
import { useEffect, useState, VFC } from 'react'
import { FaShip } from 'react-icons/fa'

import Backend from './Backend'
import { addShortcut } from './helpers'

const Content: VFC<{ backend: Backend }> = ({ backend }) => {
  const [isAuthenticated, setAuthenticated] = useState<boolean | null>(null)

  const tryLogin = () =>
    backend.login().then(
      (result) => setAuthenticated(result === true),
      () => setAuthenticated(false),
    )

  useEffect(() => {
    tryLogin()
  }, [])

  return (
    <PanelSection title="Epic Games">
      <PanelSectionRow>
        {isAuthenticated === null ?
          <ButtonItem layout="below" disabled>
            Loading...
          </ButtonItem>
        : isAuthenticated ?
          <ButtonItem layout="below" onClick={() => backend.invalidateUserdata().then(tryLogin)}>
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
        <ButtonItem
          layout="below"
          disabled={!isAuthenticated}
          onClick={async () => {
            const gameList = await backend.getGameList()
            console.log('GAME LIST', gameList)

            for (const game of gameList) {
              addShortcut({ name: game.app_title, target: 'legendary', cwd: '/usr/bin', launchOptions: '' })
            }
          }}
        >
          Sync library
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  )
}

const EpicLogin: VFC<{ backend: Backend }> = ({ backend }) => {
  // const browser = useMemo(() => {
  //   const b = (Router.WindowStore?.GamepadUIMainWindowInstance as any)?.CreateBrowserView('legendary.gl')
  //   b.LoadURL('https://legendary.gl/epiclogin')
  //   // b.LoadURL('https://www.whatismybrowser.com/detect/are-cookies-enabled')
  //   return b
  // }, [])

  // console.log(browser)

  // return (
  //   <BrowserContainer
  //     browser={browser}
  //     className="mainbrowser_ExternalBrowserContainer_3FyI1 activeBrowserTab_BrowserContainer"
  //     visible
  //     hideForModals
  //     external
  //     autoFocus
  //   />
  // )
  const [code, setCode] = useState('')

  console.log(backend)

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
      <DialogButton
        onClick={() => {
          console.log(code)
          backend.authCode(code)
        }}
      >
        Done
      </DialogButton>
    </div>
  )
}

export default definePlugin((serverApi: ServerAPI) => {
  const backend = new Backend(serverApi)

  serverApi.routerHook.addRoute('/legendary-epic-login', () => <EpicLogin backend={backend} />, { exact: true })

  return {
    title: <div className={staticClasses.Title}>epic-games-deck</div>,
    content: <Content backend={backend} />,
    icon: <FaShip />,
    onDismount() {
      serverApi.routerHook.removeRoute('/legendary-epic-login')
    },
  }
})
