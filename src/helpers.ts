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
