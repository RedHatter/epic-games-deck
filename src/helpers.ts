import Backend from './Backend'
import { GameInfo } from './GameInfo'
import * as R from 'remeda'

export const addShortcut = async ({
  name,
  target,
  cwd,
  launchOptions,
}: {
  name: string
  target: string
  cwd: string
  launchOptions: string
}) => {
  console.log('shortcut', name, target, cwd, launchOptions)
  const appid = await SteamClient.Apps.AddShortcut(name, target, cwd, launchOptions)

  // The above is broken we need to set launch options and name manually
  await SteamClient.Apps.SetShortcutLaunchOptions(appid, launchOptions)
  await SteamClient.Apps.SetShortcutName(appid, name)

  return appid
}

export const addGame = async ({ game, backend }: { game: GameInfo; backend: Backend }) => {
  const exec = await backend.getExec()

  const appid = await addShortcut({
    name: game.app_title,
    target: `${exec} launch ${game.app_name}`,
    cwd: '/usr/bin',
    launchOptions: '',
  })

  const capsule = R.find(game.metadata.keyImages, (i) => i.type === 'DieselGameBoxTall')?.url

  if (capsule) {
    const data = await backend.download(capsule)
    await SteamClient.Apps.SetCustomArtworkForApp(appid, data, 'jpg', 0)
  }

  const wide = R.find(game.metadata.keyImages, (i) => i.type === 'DieselGameBox')?.url

  if (wide) {
    const data = await backend.download(wide)
    await SteamClient.Apps.SetCustomArtworkForApp(appid, data, 'jpg', 1)
    await SteamClient.Apps.SetCustomArtworkForApp(appid, data, 'jpg', 3)
  }

  return appid
}
