window.remote            = require('electron').remote;
let {ipcRenderer}        = require('electron');
window.ipcRenderer       = ipcRenderer;

//window.appPaths        = require('../libs/environ/paths.js');
//window.locutus         = require('../libs/locutus_php/locutus_php.js');
window.cCharacterBuild   = require('../libs/character/character_build.js');
window.cTestServerGen    = require('../libs/test_server/test_server_gen.js');