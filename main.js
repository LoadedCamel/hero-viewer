const {app, BrowserWindow}   = require('electron');
const {ipcMain}              = require('electron');
const dialog                 = require('electron').dialog;
const path                   = require('path');
const url                    = require('url');

const appPaths               = require('./libs/environ/paths.js');

let win;        // Main window
let testSrvWin; // Test server build window

function init() {
	win = new BrowserWindow({
		width: 1135,
		height: 850,
		frame: false,
		skipTaskbar: false,
		show: false,
		backgroundColor: '#000000',
		resizable: false,
		maximizable: false,
		title: 'Hero Viewer',
		icon: path.join(__dirname, 'images', 'schematic_purple_gem.png'),
		webPreferences: {
			preload: path.join(__dirname, 'preload', 'main_window.js')
		}
	});

	// Frame colors for frameless windows
	// Main bg: #1c1c1c
	// Main text: #a8a8a8
	// Buttons: #404040
	// Toolbar inset: #1f1f1f
	// Buttons (hover): #7f7f7f
	// Tooltip bg: #1f1f1f
	// Tooltip text: #b5b5b5
	// Scrollbar bg: #1c1c1c
	// Scrollbar text: #353535
	// Sub-frame border: #141414
	// Scrollbar handler: #252525 / #01528a
	// Scrollbar handler (hover): #303030

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'hero_viewer.htm'),
		protocol: 'file:',
		slashes: true
	}));

	win.once('ready-to-show', () => { win.show(); });
	win.on('closed', () => {
		win = null
	});

	win.on('focus', function() {
		if ((testSrvWin != null) && testSrvWin.isVisible()) testSrvWin.focus();
	});

	testSrvWin = new BrowserWindow({
		width: 900,
		height: 600,
		frame: false,
		show: false,
		backgroundColor: '#000000',
		resizable: false,
		maximizable: false,
		center: true,
		title: 'Test server build',
		parent: win,
		icon: path.join(__dirname, 'images', 'schematic_purple_gem.png'),
		webPreferences: {
			preload: path.join(__dirname, 'preload', 'test_server_window.js')
		}
	});

	// win.webContents.openDevTools({detach: true}); // Uncomment if you want to open the developer console at launch

	testSrvWin.loadURL(url.format({
		pathname: path.join(__dirname, 'test_server_list.htm'),
		protocol: 'file:',
		slashes: true
	}));

	testSrvWin.on('close', function(e) {
		// Prevent the window from being closed - meaning the window object will be destroyed.
		// Instead, just hide it so it doesn't have to be re-created from scratch.
		e.preventDefault();

		testSrvWin.hide();
		win.focus();
	});
}

app.on('ready', init);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (win === null) {
		init();
	}
});

//////////////////////////////

ipcMain.on('importBuild', (event, data) => {
	dialog.showOpenDialog(win, {
		properties: ['openFile'],
		filters: [
			{name: 'Hero/Villain build', extensions: ['mxd']},
			{name: 'All files', extensions: ['*']}
		],
		defaultPath: path.join(__dirname, appPaths.buildsDir)
	}).then(result => {
		if (result.canceled) return;

		event.sender.send('buildFileData', result.filePaths[0]);
	}).catch(err => {
		console.log(err);
	});
});

ipcMain.on('openConfig', (event, file) => {
	dialog.showOpenDialog(win, {
		properties: ['openFile'],
		filters: [
			{name: 'Build config setup', extensions: ['json']},
			{name: 'All files', extensions: ['*']}
		],
		defaultPath: path.join(__dirname, appPaths.buildsDir)
	}).then(result => {
		if (result.canceled) return;

		event.sender.send('sourceConfigFileData', result.filePaths[0]);
	}).catch(err => {
		console.log(err);
	});
});

ipcMain.on('saveConfig', (event, data) => {
	dialog.showSaveDialog(win, {
		properties: ['openFile'],
		filters: [
			{name: 'Build config setup', extensions: ['json']}
		]
	}).then(result => {
		if (result.canceled) return;

		event.sender.send('targetConfigFileData', result.filePaths[0]);
	}).catch(err => {
		console.log(err);
	});
});

ipcMain.on('buildParseFail', (event, data) => {
	dialog.showMessageBox(win, {
		type: 'error',
		buttons: ['OK'],
		title: 'Build loading error',
		message: 'Failed to load build. You picked a build that has only a binary data chunk.' + "\n" + 'Open this file in Mids\' and save it again.'
	});
});

// Todo
ipcMain.on('buildParseFail_tooOld', (event, data) => {
	dialog.showMessageBox(win, {
		type: 'error',
		buttons: ['OK'],
		title: 'Build loading error',
		message: 'Failed to load build.' + "\n" + 'You are trying to load a build from a distant timestream, in which Fitness was not inherent.' + "\n" + 'Go and ask Sister Solaris if the Sybils can offer some translation.'
	});
});

ipcMain.on('saveConfig_errNoBuild', (event, data) => {
	dialog.showMessageBox(win, {
		type: 'error',
		buttons: ['OK'],
		title: 'Build config error',
		message: 'Cannot save build configuration.' + "\n" + 'Please import a build first.'
	});
});

ipcMain.on('testServer_errNoBuild', (event, data) => {
	dialog.showMessageBox(win, {
		type: 'error',
		buttons: ['OK'],
		title: 'Build config error',
		message: 'Cannot enter build into test server mode.' + "\n" + 'Please import a build first.'
	});
});

// data holds charBuild
ipcMain.on('openTestSrvWin', (event, data) => {
	if (
		((testSrvWin !== null) && (testSrvWin !== undefined)) &&
		(testSrvWin.isVisible())
	) return;

	testSrvWin.webContents.send('testSrvBaseBuild', data);
	testSrvWin.show();
});

ipcMain.on('closeTestSrvWin', (event, data) => {
	if (
		((testSrvWin !== null) && (testSrvWin !== undefined)) &&
		(testSrvWin.isVisible())
	)

	testSrvWin.hide();
	win.focus();
});

ipcMain.on('win_main_minimize', (event, data) => {
	win.minimize();
});

ipcMain.on('win_main_close', (event, data) => {
	win.close();
});