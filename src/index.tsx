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

import useAPI from './useAPI'

const Content: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
  const api = useAPI(serverAPI)

  useEffect(() => {
    api.login()
  }, [])

  return (
    <PanelSection title="Epic Games">
      <PanelSectionRow>
        {api.isAuthenticated === null ?
          <ButtonItem layout="below" disabled>
            Loading...
          </ButtonItem>
        : api.isAuthenticated ?
          <ButtonItem layout="below" onClick={api.logout}>
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
        <ButtonItem layout="below" disabled={!api.isAuthenticated} onClick={api.syncLibrary}>
          Sync library
        </ButtonItem>
        <ButtonItem layout="below" onClick={api.clearLibrary}>
          Clear library
        </ButtonItem>
      </PanelSectionRow>
    </PanelSection>
  )
}

const EpicLogin: VFC<{ serverAPI: ServerAPI }> = ({ serverAPI }) => {
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
  const api = useAPI(serverAPI)

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
      <DialogButton onClick={() => api.login(code)}>Done</DialogButton>
    </div>
  )
}

export default definePlugin((serverAPI: ServerAPI) => {

  serverAPI.routerHook.addRoute('/legendary-epic-login', () => <EpicLogin serverAPI={serverAPI} />, { exact: true })

  return {
    title: <div className={staticClasses.Title}>epic-games-deck</div>,
    content: <Content serverAPI={serverAPI} />,
    icon: <FaShip />,
    onDismount() {
      serverAPI.routerHook.removeRoute('/legendary-epic-login')
    },
  }
})
