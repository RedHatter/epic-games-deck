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

class Plugin:
    async def login(self):
        core = LegendaryCore()
        return core.login()

    async def invalidate_userdata(self):
        core = LegendaryCore()
        core.lgd.invalidate_userdata()

    async def auth_code(self, code):
        core = LegendaryCore()
        decky_plugin.logger.info('Setting auth code: ' + code)
        return core.auth_code(code)

    async def get_game_list(self):
        core = LegendaryCore()
        if not core.login():
            decky_plugin.logger.error('Login failed, cannot continue!')
            
        games = core.get_game_and_dlc_list(update_assets=True, platform='Windows', force_refresh=True, skip_ue=True)[0]

        data = []
        for game in games:
            _j = vars(game)
            data.append(_j)

        return data
        # return json.dumps(data)

    async def _unload(self):
        pass