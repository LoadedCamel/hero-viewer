window.appPaths          = require('../libs/environ/paths.js');
window.cPowersDB         = require('../libs/mhd_db/powers/powers_db.js');
window.cEnhancementsDB   = require('../libs/mhd_db/enhancements/enhancements_db.js');
window.cRecipesDB        = require('../libs/mhd_db/recipes/recipes_db.js');
window.cSalvagesDB       = require('../libs/mhd_db/salvages/salvages_db.js');
window.cPlainBuildParser = require('../libs/mxd_parser/plain_text_parser.js');
window.cGui              = require('../libs/gui/main_window_gui.js');
window.locutus           = require('../libs/locutus_php/locutus_php.js');

window.fs                = require('fs');
let {ipcRenderer}        = require('electron');
window.ipcRenderer = ipcRenderer;