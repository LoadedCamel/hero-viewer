'use strict';

const remote            = require('electron').remote;

const cPlainBuildParser = require('../mxd_parser/plain_text_parser.js');
const cCharacterBuild   = require('../character/character_build.js');
const cEnhancementsDB   = require('../mhd_db/enhancements/enhancements_db.js');
const locutus           = require('../locutus_php/locutus_php.js');

const appInfo           = require('../../package.json');
const appName           = appInfo.name;
const appVersion        = appInfo.version;
const appBuild          = appInfo.build;

module.exports = class {
	static _setTitle(t) {
		try
		{
			document.title = t;
		}
		catch(ex)
		{
		}

		var dTitle = document.getElementById('apptitle');
		if (dTitle) dTitle.innerHTML = t;
	}

	static init() {
		this.infoPopup.iPopup = document.getElementById('info_popup');
		this.infoPopup.parent = this;

		// Ref: https://discuss.atom.io/t/how-to-make-developer-tools-appear/16232/4
		document.addEventListener('keydown', function(e) {
			if (e.which === 123) // F12
			{
				remote.getCurrentWindow().toggleDevTools();
			}
		});

		this._setTitle(appName + ' ' + appVersion + ' (build ' + appBuild + ')');
	}

	static enhCheckMode = false;
	static catalystMode = false;
	static boostersMode = false;
	static updateUIFromToggles() {
		// Enhancement check mode
		document.getElementById('senhchecktoggle').className = this.addRemoveCSSClass(document.getElementById('senhchecktoggle').className, 'active', this.enhCheckMode);
		document.getElementById('powers1').className = this.addRemoveCSSClass(document.getElementById('powers1').className, 'enhcheck', this.enhCheckMode);
		document.getElementById('powers2').className = this.addRemoveCSSClass(document.getElementById('powers2').className, 'enhcheck', this.enhCheckMode);
		document.getElementById('powers3').className = this.addRemoveCSSClass(document.getElementById('powers3').className, 'enhcheck', this.enhCheckMode);

		if ((charBuild.counters.enhancements > 0) && (charBuild.counters.enhcheck == 0)) document.getElementById('cnt_enhcheck').className = (this.enhCheckMode ? 'active' : '');

		// Catalyst mode
		document.getElementById('scatalysttoggle').className = this.addRemoveCSSClass(document.getElementById('scatalysttoggle').className, 'active', this.catalystMode);

		// Boosters Mode
		document.getElementById('sboostertoggle').className = this.addRemoveCSSClass(document.getElementById('sboostertoggle').className, 'active', this.boostersMode);
	}

	static addCSSClass(baseClasses, className, condition=true, defaultValue='') {
		var chunks = baseClasses.trim().split(/\s/g);
		if (condition)
		{
			chunks[chunks.length] = className;
		}
		else if (defaultValue != '')
		{
			chunks[chunks.length] = defaultValue;
		}

		chunks = locutus.php.arrayUnique(chunks);

		return chunks.join(' ');
	}

	static removeCSSClass(baseClasses, className, condition=true) {
		var chunks = baseClasses.trim().split(/\s/g);
		var i;

		if (condition)
		{
			for (i=0 ; i<chunks.length ; i++)
			{
				if (chunks[i] == className)
				{
					chunks.splice(i, 1);
					return chunks.join(' ');
				}

			}

			return chunks.join(' ');
		}
		else
		{
			return baseClasses;
		}
	}

	static addRemoveCSSClass(baseClasses, className, condition=true) {
		if (condition)
		{
			return this.addCSSClass(baseClasses, className, true);
		}
		else
		{
			return this.removeCSSClass(baseClasses, className, true);
		}
	}

	static getBgImages(id, prefix=false) {
		try
		{
			var el = document.getElementById(id);
		}
		catch(ex)
		{
			console.log('main_window_gui::getBgImages(): ' + id + ' not found in page.');

			return null;
		}

		if (!el.style.backgroundImage) return '';

		return ((prefix) ? 'background-image: ' : '') + el.style.backgroundImage;
	}

	static _splitBgImagesList(bgList) {
		bgList = bgList.split(/background\-image\: |(,?)( ?)url\(|\)/);
		bgList = bgList.filter(function(e) { return ((e !== undefined) && (e != ',') && (e != '') && (e != ' ') && (e != ';') && !/background\-image\:/.test(e)); })
		bgList = bgList.map(function(e) { return 'url(' + e + ')'; });

		return bgList;
	}

	static addBgImage(bgList, newImg, imgType, prefix=false) {
		var urlList = this._splitBgImagesList(bgList);
		var newImgUrl = 'url("' + newImg + '")';
		if (imgType === 'overlayBG')
		{
			urlList.unshift(newImgUrl);
		}
		else
		{
			urlList.push(newImgUrl);
		}

		return ((prefix) ? 'background-image: ' : '')  + urlList.join(', ') + ((prefix) ? ';' : '');
	}

	static removeBgImageByType(bgList, imgType, prefix=false) {
		var urlList = this._splitBgImagesList(bgList);
		var tmp = [], i, type;
		var isIOBG = new RegExp(appPaths.images.enh.iosets.replace(/\//g, '\\/'));
		var isOverlayBG = new RegExp(appPaths.images.enh.overlays.replace(/\//g, '\\/'));
		for (i=0 ; i<urlList.length ; i++)
		{
			if (isIOBG.test(urlList[i]))
			{
				type = 'setBG';
			}
			else if (isOverlayBG.test(urlList[i]))
			{
				type = 'overlayBG';
			}
			else
			{
				type = null;
			}

			if (type != imgType) tmp[tmp.length] = urlList[i];
		}

		return ((prefix) ? 'background-image: ' : '')  + tmp.join(', ') + ((prefix) ? ';' : '');
	}

	static replaceBgImageByType(bgList, imgType, imgUrl, prefix=false) {
		var tmp = this.removeBgImageByType(bgList, imgType, true);

		return this.addBgImage(tmp, imgUrl, imgType, prefix);
	}

	static infoPopup = class {
		static iPopup     = null;
		static prevTarget = null;
		static state      = false;

		static trigger(o) {
			var i, j, k, e, en;
			var tid = ((o.id === undefined) ? null : o.id);
			if (tid == this.prevTarget) return;
			this.prevTarget = tid;
			if (this.state && (!/^enhslot/.test(tid)) && (tid != 'info_popup'))
			{
				this._hide();
			}

			if (!/^enhslot/.test(tid)) return;
			this.state = true;

			var uid         = o.attributes.getNamedItem('data-uid').value;
			var shortname   = o.attributes.getNamedItem('data-shortname').value;
			var longname    = o.attributes.getNamedItem('data-longname').value;
			var rarity      = o.attributes.getNamedItem('data-grade').value;
			var id          = o.attributes.getNamedItem('data-id').value;
			var enhIDList   = o.attributes.getNamedItem('data-enhidlist').value;
			var nidSet      = o.attributes.getNamedItem('data-nidset').value;
			var rarityClass = recipesDB.rarityClass(rarity);

			if (uid < 0) return;

			if (enhIDList == '')
			{
				enhIDList = [];
			}
			else
			{
				enhIDList = enhIDList.split(/\,/g);
				for (i=0 ; i<enhIDList.length ; i++)
				{
					enhIDList[i] = parseInt(enhIDList[i]);
				}
			}

			var enhSet, setName;
			var pe;
			var ps  = [];
			var psi = [];

			var ret = '<h1 class="bold ' + rarityClass + '">' + longname.replace(/\s/g, '&nbsp;') + '</h1>';
			for (i=0 ; i<enhIDList.length ; i++)
			{
				e = enhDB.fetchEnhancementById(enhIDList[i]);
				if (e.data.nIDSet >= 0)
				{
					enhSet = enhDB.fetchSetById(e.data.nIDSet);
					setName = enhSet.name;
					if (psi[e.data.nIDSet] === undefined)
					{
						k = ps.length;
						ps[k] = {
							name: setName,
							nID: e.data.nIDSet,
							enhIDList: enhSet.enhancementsID,
							pickedCount: 1,
							pickedEnhLN: [],
							data: enhSet
						};
						psi[e.data.nIDSet] = k;

						for (j in enhSet.enhancements)
						{
							if (enhSet.enhancements[j].LongName === undefined) continue;
							if (enhSet.enhancements[j].StaticIndex === undefined) continue;
							ps[k].pickedEnhLN[ps[k].pickedEnhLN.length] = {
								longName: enhSet.enhancements[j].LongName,
								picked: locutus.php.inArray(enhSet.enhancements[j].StaticIndex, enhIDList)
							};
						}
					}
					else
					{
						ps[psi[e.data.nIDSet]].pickedCount++;
					}
				}
			}

			for (i=0 ; i<ps.length ; i++)
			{
				if (i > 0) ret += '<br />';
				ret += '<strong style="color: #DDD;">' + ps[i].name + ' (' + ps[i].pickedCount + '/' + ps[i].enhIDList.length + ')</strong>';
				// Only detail curent set
				if (ps[i].nID == nidSet)
				{
					for (j=0 ; j<ps[i].pickedEnhLN.length ; j++)
					{
						ret += '<br /><span style="color: #' + ((ps[i].pickedEnhLN[j].picked) ? '49D9F2' : 'AAA') + ';' + ((!ps[i].pickedEnhLN[j].picked) ? ' font-style: italic;' : '') + '">' + ps[i].pickedEnhLN[j].longName + '</span>';
					}
				}
			}

			/*
			if (nidSet != '')
			{
				enhSet = enhDB.fetchSetById(nidSet);
				setName = enhSet.name;
				pe = locutus.php.arrayIntersect(enhSet.enhancementsID, enhIDList);

				ret += '<strong>' + setName + ' (' + pe.length + '/' + enhSet.enhancementsID.length + ')</strong>';
			}*/

			this.iPopup.innerHTML = ret;

			var oPos        = o.getBoundingClientRect();
			var l           = oPos.left + 35;
			var t           = oPos.top  + 35;
			var pPos        = this.iPopup.getBoundingClientRect();

			// Align popup with source element
			var popupLeft, popupTop;
			var popupWidth  = pPos.width; // this.iPopup.outerWidth;
			var popupHeight = pPos.height; // this.iPopup.outerHeight;

			if (l + popupWidth > window.innerWidth - 20)
			{
				popupLeft = window.innerWidth - popupWidth - 25;
			}
			else
			{
				popupLeft = l;
			}

			if (t + popupHeight > window.innerHeight - 20)
			{
				popupTop = window.innerHeight - popupHeight - 25;
			}
			else
			{
				popupTop = t;
			}

			popupLeft = Math.floor(Math.max(window.scrollX + 5, popupLeft));
			popupTop  = Math.floor(Math.max(window.scrollY + 5, popupTop));

			this.iPopup.style.left    = popupLeft + 'px';
			this.iPopup.style.top     = popupTop  + 'px';
			this.iPopup.style.visibility = 'visible';
			this.iPopup.style.opacity = 1;
		}

		static _hide() {
			this.iPopup.style.opacity = 0;
			this.iPopup.style.visibility = 'hidden';
			this.state = false;
		}

		static parent = null;
	}

	static drawPower(idx, power) {
		var idList = [];
		var enhIDList = [];
		var overlayImg, rarity, enhcheckBool, i, j;
		var ret = '<div class="powerslot active">';
		ret += '<div class="inner"></div>';
		ret += '<div class="label">(' + ((power.level == 0) ? 'Inh' : power.level) + ') ' + power.name + '</div>';
		if ((power.slots !== null) && (power.slots.length > 0))
		{
			j = 0;
			for (var i=0 ; i<power.slots.length ; i++)
			{
				if (power.slots[i].data === null) continue;
				enhIDList[j++] = power.slots[i].data.StaticIndex;
			}

			ret += '<ul class="slots">';
			for (var i=0 ; i<power.slots.length ; i++)
			{
				if (power.slots[i].base === null)
				{
					ret += '<li class="empty"></li>';
				}
				else
				{
					try
					{
						if (/^(HO|HY|TN)\:/.test(power.slots[i].base))
						{
							rarity = 4;
						}
						else if (/^Superior /.test(power.slots[i].data.LongName))
						{
							rarity = 3;
						}
						// Note: Not handled by Mids' (yet) but regular IOs can be upgraded to Attuned ones by combining with a catalyst.
						// So for now "Attuned..." refer only to ATOs.
						else if (/Attuned/.test(power.slots[i].data.LongName))
						{
							rarity = 2;
						}
						else if (/^Sudden Acceleration\:/.test(power.slots[i].data.LongName))
						{
							rarity = 2;
						}
						else if ((power.slots[i].recipe === null) || (power.slots[i].recipe.rarity === undefined) || (power.slots[i].recipe.rarity < 0))
						{
							rarity = 0;
						}
						else
						{
							rarity = power.slots[i].recipe.rarity;
						}

						// Annihilation has set image + overlay mixed into one.
						if (/^Annihilation/.test(power.slots[i].data.LongName))
						{
							overlayImg = '';
						}
						else if (/^(HO|HY|TN)\:/.test(power.slots[i].base))
						{
							overlayImg = 'HO.png';
						}
						else if (power.slots[i].catalysis && !cEnhancementsDB.isATO(power.slots[i].data) && !cEnhancementsDB.isMovieE(power.slots[i].data) && cEnhancementsDB.isIO(power.slots[i].data))
						{
							overlayImg = ((rarity == 3) ? 'Superior' : '') + 'Attuned.png';
						}
						else if (cEnhancementsDB.isIO(power.slots[i].data))
						{
							overlayImg = 'IO.png';
						}
						else
						{
							overlayImg = '';
						}

						enhcheckBool = ((power.enhCheckList === null) ? true : power.enhCheckList[i]);
						ret += '<li id="enhslot' + idx + '-' + i + '" class="enh' + (enhcheckBool ? ' active' : '') + (power.slots[i].boost ? ' boost' : '') + '" data-uid="' + power.slots[i].data.UID + '" data-shortname="' + (power.slots[i].base + '-' + power.slots[i].subMember) + '" data-longname="' + power.slots[i].data.LongName + '" data-grade="' + rarity + '" data-nidset="' + ((power.slots[i].data.nIDSet > 0) ? power.slots[i].data.nIDSet : '') + '" data-id="' + power.slots[i].data.StaticIndex + '" data-enhidlist="' + enhIDList.join(',') + '" style="background-image: ' + ((overlayImg != '') ? 'url(\'' + appPaths.images.enh.overlays + '/' + overlayImg + '\'), ' : '') + 'url(\'' + appPaths.images.enh.iosets + '/' + power.slots[i].data.Image + '\');"></li>';
					}
					catch (ex)
					{
						console.log('Cannot find enhancement data for ' + power.name + ' slot ' + (i + 1))
						enhcheckBool = ((power.enhCheckList === null) ? true : power.enhCheckList[i]);
						overlayImg = appPaths.images.enh.overlays + '/Training.png';

						ret += '<li id="enhslot' + idx + '-' + i + '" class="enh' + (enhcheckBool ? ' active' : '') + '" data-uid="-1" data-shortname="" data-longname="" data-grade="0" data-nidset="" data-id="-1" data-enhidlist="' + enhIDList.join(',') + '" style="cursor: default !important; background-image: url(\'images/E_ICON_BefuddlingAura.png\'), url(\'' + overlayImg + '\');"></li>';
					}
				}
			}
			ret += '</ul>';
		}
		ret += '</div>';

		return ret;
	}

	static loadConfig(file) {
		mxdBuild  = new cPlainBuildParser(null);
		charBuild = new cCharacterBuild();

		var cnt      = (fs.readFileSync(file)).toString();
		var jsonTree = JSON.parse(fs.readFileSync(file));

		mxdBuild.cnt = jsonTree.sourceBuild;

		var i;
		for (i=0 ; i<charBuild.importFields.length ; i++)
		{
			charBuild[charBuild.importFields[i]] = jsonTree[charBuild.importFields[i]];
		}

		this.loadBuild(false);
	}

	static loadBuild(file) {
		if (file !== false)
		{
			mxdBuild  = new cPlainBuildParser(file);
			charBuild = mxdBuild.parse();
			if (charBuild === null)
			{
				ipcRenderer.send('buildParseFail');

				return;
			}
		}

		charBuild.linkAllToDB(enhDB, recipesDB, salvagesDB, appPaths.mainDir, appPaths.playerSpecDir, appPaths.poolsDir);

		// Column 1: powers 1-12 + Class inherent, brawl, sprint, rest
		// Column 2: powers 14-28 + Fitness inherent + bright/dark nova powers
		// Column 3: powers 30-49 + Energy Flight/Combat Flight (PB) + White/Black Dwarf powers

		// Bright Nova subpowers: Bright Nova Bolt, Bright Nova Blast, Bright Nova Scatter, Bright Nova Detonation
		// White Dwarf subpowers: White Dwarf Strike, White Dwarf Smite, White Dwarf Flare, White Dwarf Sublimation, White Dwarf Antagonize, White Dwarf Step

		// Dark Nova subpowers: Dark Nova Bolt, Dark Nova Blast, Dark Nova Emanation, Dark Nova Detonation
		// Black Dwarf subpowers: Black Dwarf Strike, Black Dwarf Smite, Black Dwarf Mire, Black Dwarf Drain, Black Dwarf Step, Black Dwarf Antagonize

		// Bio Armor subpowers: Adaptation => Defensive Adaptation, Efficient Adaptation, Offensive Adaptation
		// Staff Fighting subpowers: Staff Mastery => Form of the Body, Form of the Mind, Form of the Soul

		// Todo: AT and powerset icons, hero/villain colors, ingame-like columns, order by sub-index if present (e.g. inherent fitness powers, level 1 powers of powersets)

		var charID             = charBuild.getCharacterID();
		var charPowersets      = charBuild.getPowersets('main');
		var poolPowersets      = charBuild.getPowersets('pools');
		var charPowersetsShort = charBuild.getPowersetsShort();
		var h                  = document.getElementById('header');
		var gp;

		this._setTitle('Hero Viewer - ' + ((charID.name != '') ? charID.name + ' - ' : '') + charID.at + ' (' + charPowersetsShort.powersets.primary + '/' + charPowersetsShort.powersets.secondary + ')');
		h.innerHTML = ((charID.name != '') ? '<strong>' + charID.name + '</strong> - ' : '') + 'Level ' + charID.level + ' ' + charID.origin + ' ' + charID.at + '<br />' + charPowersetsShort.powersets.primary + '/' + charPowersetsShort.powersets.secondary + '<br />Built with ' + charBuild.builder.product + ' v' + charBuild.builder.version;

		document.body.className = (charBuild.isVillain() ? 'villain' : '');

		var i, j, p, ci;
		var c = [];
		for (i=0 ; i<3 ; i++)
		{
			c[i] = document.getElementById('powers' + (i + 1));
			c[i].innerHTML = '';
		}

		var prevPri = null;
		var prevSec = null;

		// Pass 1: main powers
		for (i=0 ; i<charBuild.getPowersCount() ; i++)
		{
			p = charBuild.getPowerByIndex(i);

			if (p.level == 0) continue;
			switch (p.name)
			{
				case 'Rest': case 'Brawl': case 'Sprint':
					continue;
					break;

				case 'Swift': case 'Hurdle': case 'Health': case 'Stamina':
					continue;
					break;

				default:
					if (/^(Bright|Dark) Nova (.+)/.test(p.name) || /^(White|Black) Dwarf (.+)/.test(p.name)) continue;
			}

			if ((p.level >= 1) && (p.level <= 12))
			{
				ci = 0;
			}
			else if (p.level <= 28)
			{
				ci = 1;
			}
			else if (p.level <= 50)
			{
				ci = 2;
			}

			c[ci].innerHTML = c[ci].innerHTML + this.drawPower(i, p); // (i, p, charID.alignment)
		}

		// Pass 2: secondary powers (inherent, accolades)
		for (i=0 ; i<charBuild.getPowersCount() ; i++)
		{
			p = charBuild.getPowerByIndex(i);

			switch (p.name)
			{
				case 'Rest': case 'Brawl': case 'Sprint':
					ci = 0;
					break;

				case 'Swift': case 'Hurdle': case 'Health': case 'Stamina':
					ci = 1;
					break;

				default:
					if (/^(Bright|Dark) Nova (.+)/.test(p.name)) ci = 1;
					else if (/^(White|Black) Dwarf (.+)/.test(p.name)) ci = 2;
					else continue;
			}

			c[ci].innerHTML = c[ci].innerHTML + this.drawPower(i, p);
		}

		// Pass 3: stances, etc
		for (i=0 ; i<charBuild.getPowersCount() ; i++)
		{
			p = charBuild.getPowerByIndex(i);

			if (/ Adaptation$/.test(p.name) || // Bio Armor
				/^Form of the /.test(p.name) || // Staff Fighting
				/ Ammunition$/.test(p.name) // Dual Pistols
			)
			{
				ci = 1;
			}
			else if (/^(Fury|Scourge|Defiance)$/.test(p.name)) // AT inherents (incomplete)
			{
				ci = 0;
			}
			else
			{
				continue;
			}

			c[ci].innerHTML = c[ci].innerHTML + this.drawPower(i, p);
		}

		var primarySpecCol   = document.getElementById('primaryspec');
		var secondarySpecCol = document.getElementById('secondaryspec');
		var poolsCol         = document.getElementById('pools');
		var pickedPowers;

		poolsCol.innerHTML = '';

		pickedPowers = charBuild.getPickedPowersInSets();
		if ((pickedPowers.trunks !== null) && (pickedPowers.trunks.primary !== null))
		{
			primarySpecCol.innerHTML = '<span class="specname">' + charPowersets.powersets.primary[0] + '</span>';
			for (i in pickedPowers.trunks.primary)
			{
				if ((typeof i != 'string') || (typeof pickedPowers.trunks.primary[i] != 'boolean')) continue;
				primarySpecCol.innerHTML = primarySpecCol.innerHTML + '<span' + ((pickedPowers.trunks.primary[i] === true) ? ' class="active"' : '') + '>' + i.replace(/\s/g, '&nbsp;') + '</span><br />';
			}

			primarySpecCol.innerHTML = primarySpecCol.innerHTML + '<span class="specname">' + charPowersets.powersets.primary[1] + '</span>';
			for (i in pickedPowers.primary)
			{
				if ((typeof i != 'string') || (typeof pickedPowers.primary[i] != 'boolean')) continue;
				primarySpecCol.innerHTML = primarySpecCol.innerHTML + '<span' + ((pickedPowers.primary[i] === true) ? ' class="active"' : '') + '>' + i.replace(/\s/g, '&nbsp;') + '</span><br />';
			}
		}
		else
		{
			primarySpecCol.innerHTML = '<span class="specname">' + charPowersets.powersets.primary + '</span>';
			for (i in pickedPowers.primary)
			{
				if ((typeof i != 'string') || (typeof pickedPowers.primary[i] != 'boolean')) continue;
				primarySpecCol.innerHTML = primarySpecCol.innerHTML + '<span' + ((pickedPowers.primary[i] === true) ? ' class="active"' : '') + '>' + i.replace(/\s/g, '&nbsp;') + '</span><br />';
			}
		}

		if ((pickedPowers.trunks !== null) && (pickedPowers.trunks.secondary !== null))
		{
			secondarySpecCol.innerHTML = '<span class="specname">' + charPowersets.powersets.secondary[0] + '</span>';
			for (i in pickedPowers.trunks.secondary)
			{
				if ((typeof i != 'string') || (typeof pickedPowers.trunks.secondary[i] != 'boolean')) continue;
				secondarySpecCol.innerHTML = secondarySpecCol.innerHTML + '<span' + ((pickedPowers.trunks.secondary[i] === true) ? ' class="active"' : '') + '>' + i.replace(/\s/g, '&nbsp;') + '</span><br />';
			}

			secondarySpecCol.innerHTML = secondarySpecCol.innerHTML + '<span class="specname">' + charPowersets.powersets.secondary[1] + '</span>';
			for (i in pickedPowers.secondary)
			{
				if ((typeof i != 'string') || (typeof pickedPowers.secondary[i] != 'boolean')) continue;
				secondarySpecCol.innerHTML = secondarySpecCol.innerHTML + '<span' + ((pickedPowers.secondary[i] === true) ? ' class="active"' : '') + '>' + i.replace(/\s/g, '&nbsp;') + '</span><br />';
			}
		}
		else
		{
			secondarySpecCol.innerHTML = '<span class="specname">' + charPowersets.powersets.secondary + '</span>';
			for (i in pickedPowers.secondary)
			{
				if ((typeof i != 'string') || (typeof pickedPowers.secondary[i] != 'boolean')) continue;
				secondarySpecCol.innerHTML = secondarySpecCol.innerHTML + '<span' + ((pickedPowers.secondary[i] === true) ? ' class="active"' : '') + '>' + i.replace(/\s/g, '&nbsp;') + '</span><br />';
			}
		}

		for (i=0 ; i<poolPowersets.powerPools.length ; i++)
		{
			// Warning: Red Circle font lack parenthesis, braces and curls glyphs !
			poolsCol.innerHTML = poolsCol.innerHTML + '<span class="specname">' + (poolPowersets.powerPools[i].poolSet).replace(/\s/g, '&nbsp;') + '</span>';
			for (j in pickedPowers.pools[i])
			{
				if ((typeof j != 'string') || (typeof pickedPowers.pools[i][j] != 'boolean')) continue;
				poolsCol.innerHTML = poolsCol.innerHTML + '<span' + ((pickedPowers.pools[i][j] === true) ? ' class="active"' : '') + '>' + j.replace(/\s/g, '&nbsp;') + '</span><br />';
			}
		}

		document.getElementById('cnt_enhcheck').className  = ((charBuild.counters.enhcheck > 0) ? 'active' : '');
		document.getElementById('cnt_enhcheck').innerHTML  = charBuild.counters.enhcheck + '/' + charBuild.counters.enhancements + ' obtained';

		document.getElementById('cnt_catalysts').className = ((charBuild.counters.catalysts > 0) ? 'active' : '');
		document.getElementById('cnt_catalysts').innerHTML = ((charBuild.counters.catalysts == 0) ? '' : 'x' + charBuild.counters.catalysts);

		document.getElementById('cnt_boosters').className  = ((charBuild.counters.boosters > 0) ? 'active' : '');
		document.getElementById('cnt_boosters').innerHTML  = ((charBuild.counters.boosters == 0) ? '' : 'x' + (charBuild.counters.boosters * 5));

		document.getElementById('powerslist').className = this.addRemoveCSSClass(document.getElementById('powerslist').className, 'hidden', false);
	}
};