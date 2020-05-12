/*
Todo list:
- [ OK ] Frameless windows
- [ OK ] Move scrollbar to inner elements (div#powers1, div#powers2, div#powers3)
- [ OK ] Enhancement Catalysts (on IOs)
- [ OK ] Enhancement Boosters
- [ OK ] Counters for enhancement check mode, catalysts, boosters
- [ OK ] Show only powers/slots columns when a build/config is loaded
- [ OK ] Make use of custom, gpl-licenced fonts instead of Windows' Calibri and Segoe UI
- [ OK ] Convert fonts to WOFF2 format
- [ OK ] Link Fitness (inherent) to powers DB
- [ OK ] Link Inherents to powers DB (need extra testing for PB/WS)
- [ OK ] Link Accolades to DB
- [ OK ] Link Incarnates to DB
- Pool/spec re-ordering (for powers #1/#2, use "priority order" flag)
- Migrate modules to ES6 classes when possible (test_server_gen.js, powers_db.js)
- Info popup: show sets level ranges
- Show only toggles and save/load config when a build is loaded
- Extended tooltip for powers (all slotted sets)
- Hero/Villain/Praetorian themes
- Forum post export (may be useless to reimport into MRB...)
*/

var enhDB = null, recipeDB = null, salvagesDB = null, mxdBuild = null, charBuild = null;

enhDB = new cEnhancementsDB();
enhDB.load(appPaths.mainDir);

recipesDB = new cRecipesDB()
recipesDB.load(appPaths.mainDir);

salvagesDB = new cSalvagesDB();
salvagesDB.load(appPaths.mainDir);

document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('bopenmxd').addEventListener('click', () => {
		// Todo: If a build/config is already loaded, display a prompt before to proceed.
		ipcRenderer.send('importBuild');
	});

	document.getElementById('bopenjson').addEventListener('click', () => {
		ipcRenderer.send('openConfig');
	});

	document.getElementById('bsavejson').addEventListener('click', () => {
		if (charBuild === null)
		{
			ipcRenderer.send('saveConfig_errNoBuild');
			return;
		}

		ipcRenderer.send('saveConfig', charBuild);
	});

	document.getElementById('btestsrv').addEventListener('click', () => {
		if (charBuild === null)
		{
			ipcRenderer.send('testServer_errNoBuild');
			return;
		}

		ipcRenderer.send('openTestSrvWin', charBuild);
	});

	document.getElementById('benhchecktoggle').addEventListener('click', () => {
		if (cGui.enhCheckMode)
		{
			cGui.enhCheckMode = false;
		}
		else
		{
			cGui.enhCheckMode = true;
			cGui.catalystMode = false;
			cGui.boostersMode = false;
		}

		cGui.updateUIFromToggles();
	});

	document.getElementById('bcatalysttoggle').addEventListener('click', () => {
		if (cGui.catalystMode)
		{
			cGui.catalystMode = false;
		}
		else
		{
			cGui.enhCheckMode = false;
			cGui.catalystMode = true;
			cGui.boostersMode = false;
		}

		cGui.updateUIFromToggles();
	});

	document.getElementById('bboostertoggle').addEventListener('click', () => {
		if (cGui.boostersMode)
		{
			cGui.boostersMode = false;
		}
		else
		{
			cGui.enhCheckMode = false;
			cGui.catalystMode = false;
			cGui.boostersMode = true;
		}

		cGui.updateUIFromToggles();
	});

	/////////////////////////////////////////

	document.addEventListener('mouseover', (e) => {
		cGui.infoPopup.trigger(e.target);
	});

	document.addEventListener('click', (e) => {
		if ((/^enhslot/.test(e.target.id)) && (e.target.className != 'empty'))
		{
			var ident = e.target.id.replace(/^enhslot/, '').split(/\-/); // [power, slotID]
			var baseClasses = document.getElementById(e.target.id).className;
			if (cGui.enhCheckMode)
			{
				try
				{
					charBuild.powers[ident[0]].enhCheckList[ident[1]] = !charBuild.powers[ident[0]].enhCheckList[ident[1]];
					if (charBuild.powers[ident[0]].enhCheckList[ident[1]])
					{
						charBuild.counters.enhcheck++;
					}
					else
					{
						charBuild.counters.enhcheck--;
					}

					if (charBuild.counters.enhcheck > 0)
					{
						document.getElementById('cnt_enhcheck').className = 'active';
					}

					document.getElementById('cnt_enhcheck').innerHTML = charBuild.counters.enhcheck + '/' + charBuild.counters.enhancements + ' obtained';
					document.getElementById(e.target.id).className = cGui.addRemoveCSSClass(baseClasses, 'active', charBuild.powers[ident[0]].enhCheckList[ident[1]]);
				}
				catch(ex)
				{
					console.log('Enhancement check failed on powers.' + ident[0] + '.' + ident[1]);
					console.log(ex);

					return;
				}
			}
			else if (cGui.catalystMode)
			{
				var enhData = charBuild.powers[ident[0]].slots[ident[1]].data;
				if (cEnhancementsDB.isIO(enhData) && cEnhancementsDB.canReceiveCatalyst(enhData))
				{
					try
					{
						if (charBuild.powers[ident[0]].slots[ident[1]].boost)
						{
							console.log('Catalyst failed on powers.' + ident[0] + '.' + ident[1] + ' (holds boosters)');

							return;
						}

						charBuild.powers[ident[0]].slots[ident[1]].catalysis = !charBuild.powers[ident[0]].slots[ident[1]].catalysis;
						if (charBuild.powers[ident[0]].slots[ident[1]].catalysis)
						{
							charBuild.counters.catalysts++;
						}
						else
						{
							charBuild.counters.catalysts--;
						}

						if (charBuild.counters.catalysts > 0)
						{
							document.getElementById('cnt_catalysts').className = 'active';
						}
						else
						{
							document.getElementById('cnt_catalysts').className = '';
						}

						document.getElementById('cnt_catalysts').innerHTML = ((charBuild.counters.catalysts == 0) ? '' : 'x' + charBuild.counters.catalysts);

						var bgImages = cGui.getBgImages(e.target.id, true);
						var overlayImg;
						if (charBuild.powers[ident[0]].slots[ident[1]].catalysis)
						{
							overlayImg = ((cEnhancementsDB.isSuperiorE(enhData)) ? 'Superior' : '') + 'Attuned.png';
						}
						else
						{
							overlayImg = 'IO.png';
						}

						document.getElementById(e.target.id).style.backgroundImage = cGui.replaceBgImageByType(bgImages, 'overlayBG', appPaths.images.enh.overlays + '/' + overlayImg);
					}
					catch(ex)
					{
						console.log('Catalyst failed on powers.' + ident[0] + '.' + ident[1]);
						console.log(ex);

						return;
					}
				}
				else
				{
					console.log('Cannot apply catalyst on powers.' + ident[0] + '.' + ident[1]);
				}
			}
			else if (cGui.boostersMode)
			{
				var enhData = charBuild.powers[ident[0]].slots[ident[1]].data;
				try
				{
					if (charBuild.powers[ident[0]].slots[ident[1]].catalysis)
					{
						console.log('Boost failed on powers.' + ident[0] + '.' + ident[1] + ' (holds a catalyst)');

						return;
					}
					else if (cEnhancementsDB.isNaturallyAttuned(enhData))
					{
						console.log('Boost failed on powers.' + ident[0] + '.' + ident[1] + ' (naturally attuned)');
					}

					charBuild.powers[ident[0]].slots[ident[1]].boost = !charBuild.powers[ident[0]].slots[ident[1]].boost;
					if (charBuild.powers[ident[0]].slots[ident[1]].boost)
					{
						charBuild.counters.boosters++;
					}
					else
					{
						charBuild.counters.boosters--;
					}

					if (charBuild.counters.boosters > 0)
					{
						document.getElementById('cnt_boosters').className = 'active';
					}
					else
					{
						document.getElementById('cnt_boosters').className = '';
					}
					document.getElementById('cnt_boosters').innerHTML = ((charBuild.counters.boosters == 0) ? '' : 'x' + (charBuild.counters.boosters * 5));
					document.getElementById(e.target.id).className = cGui.addRemoveCSSClass(baseClasses, 'boost', charBuild.powers[ident[0]].slots[ident[1]].boost);
				}
				catch(ex)
				{
					console.log('Boost failed on powers.' + ident[0] + '.' + ident[1] + '(' + e.target.id + ')');
					console.log(ex);

					return;
				}
			}
		}
	});

	/////////////////////////////////////////

	document.getElementById('bmin').addEventListener('click', () => {
		ipcRenderer.send('win_main_minimize');
	});

	document.getElementById('bclose').addEventListener('click', () => {
		ipcRenderer.send('win_main_close');
	});

	/////////////////////////////////////////

	ipcRenderer.on('buildFileData', (event, file) => {
		if (file === null) return;

		file = file.toString(); // (Buffer) -> (String)
		cGui.loadBuild(file);
	});

	ipcRenderer.on('sourceConfigFileData', (event, file) => {
		if (file === null) return;

		file = file.toString();
		cGui.loadConfig(file);
	});

	ipcRenderer.on('targetConfigFileData', (event, file) => {
		if (file === null) return;

		fs.writeFileSync(file, charBuild.export());
	});

	/////////////////////////////////////////

	cGui.init();
});