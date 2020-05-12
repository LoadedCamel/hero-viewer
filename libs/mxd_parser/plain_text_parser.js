'use strict';

const fs = require('fs');
const cCharacterBuild = require('../character/character_build.js');
const locutus = require('../locutus_php/locutus_php.js');

module.exports = class {
	constructor(file) {
		if (file === null)
		{
			this.file = null;
			this.cnt  = null;
		}
		else
		{
			this.file = file;
			this.cnt  = fs.readFileSync(file);
			this.cnt  = this.cnt.toString();
		}

		// This is most likely NOT to be all of them.
		this._oldSetNames = [
			['Achilles', 'AchHee'],
			['AdjTgt', 'AdjTrg'],
			['Aegis', 'Ags'],
			['Armgdn', 'Arm'],
			['AnWeak', 'AnlWkn'],
			['BasGaze', 'BslGaz'],
			['CSndmn', 'CaloftheS'],
			['C\'ngBlow', 'ClvBlo'],
			['C\'ngImp', 'CrsImp'],
			['Dct\'dW', 'DctWnd'],
			['Decim', 'Dcm'],
			['Det\'tn', 'Dtn'],
			['Dev\'n', 'Dvs'],
			['Efficacy', 'EffAdp'],
			['Enf\'dOp', 'EnfOpr'],
			['Erad', 'Erd'],
			['ExRmnt', 'ExpRnf'],
			['ExStrk', 'ExpStr'],
			['ExtrmM', 'ExtMsr'],
			['FotG', 'FuroftheG'],
			['FrcFbk', 'FrcFdb'],
			['F\'dSmite', 'FcsSmt'],
			['GA', 'GldArm'],
			['GSFC', 'GssSynFr-'],
			['Hectmb', 'Hct'],
			['HO:Micro', 'Micro'],
			['H\'zdH', 'HrmHln'],
			['ImpSkn', 'ImpSki'],
			['Insult', 'TrmIns'],
			['KinCrsh', 'KntCrs'],
			['KntkC\'bat', 'KntCmb'],
			['Krma', 'Krm'],
			['Ksmt', 'Ksm'],
			['LkGmblr', 'LucoftheG'],
			['LgcRps', 'LthRps'],
			['Mako', 'Mk\'Bit'],
			['Mlais', 'MlsIll'],
			['Mocking', 'MckBrt'],
			['MotCorruptor', 'MlcoftheC'],
			['Mrcl', 'Mrc'],
			['M\'Strk', 'Mlt'],
			['Numna', 'NmnCnv'],
			['Oblit', 'Obl'],
			['Panac', 'Pnc'],
			['Posi', 'PstBls'],
			['Prv-Heal/EndMod', 'Prv-Heal/EndRdx'],
			['P\'ngS\'Fest', 'PndSlg'],
			['P\'Shift', 'PrfShf'],
			['Rec\'dRet', 'RctRtc'],
			['RctvArm', 'RctArm'],
			['RzDz', 'RzzDzz'],
			['SMotCorruptor', 'SprMlcoft'],
			['SprWntBit-Acc/Dmg/EndRdx/Rchg', 'SprWntBit-Dmg/EndRdx/Acc/Rchg'],
			['Srng', 'Srn'],
			['SStalkersG', 'SprStlGl'],
			['SWotController', 'SprWiloft'],
			['S\'fstPrt', 'StdPrt'],
			['T\'Death', 'TchofDth'],
			['T\'pst', 'Tmp'],
			['Thundr', 'Thn'],
			['ULeap', 'UnbLea'],
			['UndDef', 'UndDfn'],
			['WotController', 'WiloftheC'],
			['Zephyr', 'BlsoftheZ']
		];
	}

	// Deprecated, weird results with HO:micro and the others
	_filterEmpty(arr) {
		return locutus.php.arrayValues(locutus.php.arrayFilter(arr, function(e) { return (e.trim() != ''); }));
	}

	_shortNamesConversion(sn) {
		var i;
		for (var i=0 ; i<this._oldSetNames.length; i++)
		{
			if (locutus.php.strpos(i, sn) !== false)
			{
				console.log('Match: ' + sn + ' || ' + this._oldSetNames[i][0] + ' -> ' + this._oldSetNames[i][1]);
				return locutus.php.strReplace(this._oldSetNames[i][0], this._oldSetNames[i][1], sn);
			}
		}

		return sn;
	}

	parse() {
		var c = new cCharacterBuild();

		var m, el, enhs, en, r, i, j, s, st, snan, b;
		this.cnt = this.cnt.replace(/[\r\n]/g, "\r\n"); // Line conversion to PC/Win format
		this.cnt = this.cnt.replace(/\<br \/\>/g, ''); // For good ol' Mids 1.962 support
		this.cnt = this.cnt.replace(/\&nbsp\;/g, ' ');
		this.cnt = this.cnt.replace(/ {2,}/g, "\t"); // Use of \s here break newlines
		this.cnt = this.cnt.replace(/\t{2,}/g, "\t"); // Compact a little those modern builds
		this.cnt = this.cnt.replace(/(\r\n){2,}/g, "\r\n");
		c.setBuildSource(this.cnt);

		// Alignment (hero/villain), builder software and version
		// Note: old Pine Hero Designer is listed as 'Hero Hero Designer'
		m = /(Hero|Villain) Plan by ([a-zA-Z\:\'\s]+) ([0-9\.]+)/.exec(this.cnt);
		if (m === null)
		{
			return null;
		}

		m.shift();
		c.setVariables(['alignment', 'builderProduct', 'builderVersion'], m);

		// Character name, level, origin and archetype
		m = /([^\r\n\t]+)\: Level ([0-9]{1,2}) ([a-zA-Z]+) ([a-zA-Z ]+)/.exec(this.cnt);
		if (m === null)
		{
			m = /Level ([0-9]{1,2}) ([a-zA-Z]+) ([a-zA-Z ]+)/.exec(this.cnt);
			m.shift();
			m.unshift('');
			m[1] = parseFloat(m[1]);
			c.setVariables(['name', 'level', 'origin', 'at'], m);
		}
		else
		{
			m.shift();
			m[1] = parseFloat(m[1]);
			c.setVariables(['name', 'level', 'origin', 'at'], m);
		}

		// Main powersets
		r = /(Primary|Secondary) Power Set\: ([^\r\n\t]+)/g;
		while(el = r.exec(this.cnt))
		{
			c.setPowerset(el[1], el[2].replace(/^z[cn]\_/, ''));
		}

		// Pools and Ancillary/Epic powersets
		r = /(Power|Ancillary) Pool\: ([^\r\n\t]+)/g;
		while(el = r.exec(this.cnt))
		{
			c.addPool(el[1], el[2].replace(/^z[cn]\_/, ''));
		}

		// Powers: power name, level taken, enhancements list (if any)
		r = /Level ([0-9]{1,2})\:\t([^\t]+)\t([^\r\n\t]+)/g;
		while (el = r.exec(this.cnt))
		{
			el = {name: el[2].trim(), level: parseInt(el[1]), slots: ((el[3] === undefined) ? null : el[3])};

			if (/^Prestige Power /.test(el.name)) continue;

			if (el.slots !== null)
			{
				// Extract enhancement name and slot level ('A' for power inherent slot)
				el.slots = el.slots.replace(/\(([^A0-9]+)\)/g, '[$1]'); // Handle special enhancements with parenthesis like ExpRnf-+Res(Pets)(50)
				el.slots = el.slots.split(/,\s/g);

				enhs = [];
				for (i=0 ; i<el.slots.length ; i++)
				{
					s = el.slots[i].split(/[\(\)]/g);
					//s = this._filterEmpty(s);
					st = [];
					for (j=0 ; j<s.length ; j++)
					{
						if (s[j].trim() != '') st[st.length] = s[j];
					}
					s = st;

					s[0] = ((s[0] == 'Empty') ? null : this._shortNamesConversion(s[0]));
					s[1] = ((s[1] == 'A') ? 0 : parseInt(s[1]));
					if (isNaN(s[1]))
					{
						enhs = null;
						break;
					}
					else
					{
						en = ((s[0] === null) ? [null, null] : s[0].split(/\-+/g));
						// Catalysis: used an enhancement catalyst
						// Boost: used enhancement boosters x5
						enhs[i] = {base: en[0], subMember: locutus.php.strReplace(['[', ']'], ['(', ')'], en[1]), level: s[1], catalysis: false, boost: false, data: null};
					}
				}
			}
			else
			{
				enhs = null;
			}

			c.addPower(el.name, el.level, enhs);
		}

		// Unslottable powers (Inherents, Accolades, Incarnates)
		r = /Level ([0-9]{1,2})\:\t([^\r\n\t]+)/g;
		while(el = r.exec(this.cnt))
		{
			// Filter low priority powers
			el = {name: el[2].trim(), level: parseInt(el[1]), slots: null};
			if (/^Prestige Power /.test(el.name)) continue; // Slide, Dash, etc.
			if (/^Combo Level /.test(el.name)) continue; // Street Justice (?), Water Blast
			if (el.name == 'Blood Frenzy') continue; // Savage Melee/Assault
			if (el.name == 'Ninja Run') continue;
			if (el.name == 'Translocation') continue; // Sorcery pool
			if (el.name == 'Takeoff') continue; // Force of Will pool
			if (el.name == 'Quick Form') continue;
			if (el.name == 'Containment') continue; // Controllers' inherent
			if (c.getPowerByName(el.name) !== null) continue; // Do not duplicate a power

			// Stances, as sub powers, are considered inherents
			if (
				/ Adaptation$/.test(el.name) || // Bio Armor
				/^Form of the /.test(el.name) || // Staff Fighting
				/ Ammunition$/.test(el.name) || // Dual Pistols
				/^(Fury|Scourge|Defiance|Containment|Domination)$/.test(el.name) // AT inherents
			)
			{
				el.level = 0;
			}

			c.addPower(el.name, el.level, el.slots);
		}

		return c;
	}
};