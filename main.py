import os
import sys
import logging
import json

# The decky plugin module is located at decky-loader/plugin
# For easy intellisense checkout the decky-loader code one directory up
# or add the `decky-loader/plugin` path to `python.analysis.extraPaths` in `.vscode/settings.json`
import decky_plugin

root = logging.getLogger()
root.setLevel(logging.DEBUG)
handler = logging.StreamHandler(sys.stdout)
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('[%(name)s][%(levelname)s]: %(message)s')
handler.setFormatter(formatter)
root.addHandler(handler)

PLUGIN_DIR = os.path.dirname(os.path.realpath(__file__))
sys.path.append(PLUGIN_DIR+"/py_modules")

from legendary.core import LegendaryCore

from settings import SettingsManager

log = logging.getLogger('Epic')

log.info(os.environ["DECKY_PLUGIN_SETTINGS_DIR"])

settings = SettingsManager(name="settings", settings_directory=os.environ["DECKY_PLUGIN_SETTINGS_DIR"])
settings.read()

class Plugin:
    async def login(self):
        core = LegendaryCore()
        return core.login()

    async def invalidate_userdata(self):
        core = LegendaryCore()
        core.lgd.invalidate_userdata()

    async def auth_code(self, code):
        core = LegendaryCore()
        log.info('Setting auth code: ' + code)
        return core.auth_code(code)

    async def sync_library(self, appidList):
        core = LegendaryCore()
        if not core.login():
            log.error('Login failed, cannot continue!')
            
        games = core.get_game_and_dlc_list(update_assets=True, platform='Windows', force_refresh=True, skip_ue=True)[0]

        data = []
        for game in games:
            _j = vars(game)
            data.append(_j)

        map = settings.getSetting('appid_map', {})
        return [g for g in data if g['app_name'] not in map or map[g['app_name']] not in appidList]

    async def update_appid_map(self, value):
        log.info(json.dumps(value))
        map = settings.getSetting('appid_map', {})
        map.update(value)
        settings.setSetting('appid_map', map)

    async def _unload(self):
        pass