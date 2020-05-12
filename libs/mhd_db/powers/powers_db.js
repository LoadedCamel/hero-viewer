'use strict';

const locutus = require('../../locutus_php/locutus_php.js');
const os = require('os');
const fs = require('fs');

module.exports = function (mainDir, playerSpecsDir) {
	this.mainDir = mainDir;
	this.playerSpecsDir = playerSpecsDir;
	this.file      = null;
	this.tree      = null;
	this.aggregate = false;
	this.trunk     = null;
	this.powerNamesIndex = {};
	this.globalPowerNamesIndex = {length: 0};
	this.IDIndex = [];
	this.hAtToV = {
		'Blaster'    : 'Mastermind',
		'Tanker'     : 'Brute',
		'Scrapper'   : 'Stalker',
		'Controller' : 'Dominator',
		'Defender'   : 'Corruptor'
	};

	this.load = function(at, specType, specName) {
		if (this.tree !== null) return false;

		if (specName == 'Bio Armor')           specName = 'Bio Organic Armor';
		if (specName == 'Sonic Attacks')       specName = 'Sonic Attack';
		if (specName == 'Martial Combat')      specName = 'Martial Manipulation';
		if (specName == 'Atomic Manipulation') specName = 'Radiation Manipulation';
		if (specName == 'Street Justice')      specName = 'Brawling'

		specName = specName.replace(/^z[cn]\_/, '');

		var dbIdentifier = this._generateJsonDBPowersetIdentifier(at, specType, specName, true);

		return this._loadFile(dbIdentifier);
	};

	this.loadPool = function(at, poolType, poolName) {
		if (this.tree !== null) return false;
		if (poolName == 'Concealment') poolName = 'Invisibility';
		if ((at == 'Arachnos Soldier') || (at == 'Arachnos Widow')) at = 'VEAT';
		var whoopsAt = ((at == 'Dominator') ? 'Domingator' : null) // Woops! Typo on _Epic.Psionic_Mastery_Domingator.json
		var poolId = poolName.replace(/\s/g, '_');

		if (poolType == 'Pool')
		{
			var dbIdentifier = this.mainDir + '/_Pool.' + poolId + '.json';

			return this._loadFile(dbIdentifier);
		}
		else if (poolType == 'Ancillary')
		{
			var dbIdent = [
				((at == 'Sentinel') ? this.playerSpecsDir + '/Class_Sentinel_Epic.Sentinel_' + poolId + '.json' : null),
				((at == 'Dominator') ? mk21DbIdent = this.mainDir + '/_Epic.' + poolId + '_' + whoopsAt + '.json' : null),
				this.mainDir + '/_Epic.' + poolId + '_' + at + '.json',
				((this.hAtToV[at] !== undefined) ? this.mainDir + '/_Epic.' + this.hAtToV[at] + '_' + poolId + '.json' : null),
				this.mainDir + '/_Epic.' + at + '_' + poolId + '.json',
				this.mainDir + '/_Epic.' + poolId + '.json'
			];
			dbIdent = locutus.php.arrayFilter(dbIdent, function(e) { return (e !== null); });

			for (var i=0 ; i<dbIdent.length ; i++)
			{
				if (fs.existsSync(dbIdent[i])) return this._loadFile(dbIdent[i], false);
			}

			return false;
		}
	};

	this.loadAccolades = function() {
		var dbIdentifier = this.mainDir + '/_Temporary_Powers.Accolades.json';

		return this._loadFile(dbIdentifier);
	};

	this.loadFitnessPowers = function() {
		var dbIdentifier = this.mainDir + '/_Inherent.Fitness.json';

		return this._loadFile(dbIdentifier);
	};

	this.loadInherents = function() {
		var dbIdentifier = this.mainDir + '/_Inherent.Inherent.json';

		return this._loadFile(dbIdentifier);
	};

	this.loadIncarnates = function() {
		var incarnateSlots = ['Alpha', 'Judgement', 'Interface', 'Destiny', 'Lore', 'Hybrid'];
		var i, j, k, h, t;
		var dbFiles = [];

		for (i=0 ; i<incarnateSlots.length ; i++)
		{
			dbFiles[i] = {
				group: incarnateSlots[i],
				index: i,
				file: '_Incarnate.' + incarnateSlots[i] + '.json'
			};
		}

		this.file      = null;
		this.tree      = [];
		this.aggregate = true;
		k = 0;

		for (i=0 ; i<dbFiles.length ; i++)
		{
			t = JSON.parse(fs.readFileSync(this.mainDir + '/' + dbFiles[i].file));
			for (j=0 ; j<t.Powers.length ; j++)
			{
				t.Powers[j]['_incarnateGroup']     = dbFiles[i].group;
				t.Powers[j]['_incarnateSlotIndex'] = dbFiles[i].index;
			}

			this.tree[k] = {
				group: dbFiles[i].group,
				slotIndex: dbFiles[i].index,
				file: dbFiles[i].file,
				tree: t,
				powerNamesIndex: {},
				IDIndex: []
			};

			if (this.tree[k].tree.Power !== undefined)
			{
				for (h=0 ; h<this.tree[k].tree.Power.length ; h++)
				{
					this.tree[k].IDIndex[this.tree[k].tree.Power[h]] = h;
				}
			}

			this.tree[k].powerNamesIndex.length = 0;
			for (h=0 ; h<this.tree[k].tree.Powers.length ; h++)
			{
				this.globalPowerNamesIndex[this.tree[k].tree.Powers[h].DisplayName] = [k, h];
				this.tree[k].powerNamesIndex[this.tree[k].tree.Powers[h].DisplayName] = h;
				this.tree[k].powerNamesIndex.length++;
				this.tree[k].tree.Powers[h]._indexInSet = ((this.tree[k].tree.Power !== undefined) ? this.tree[k].IDIndex[this.tree[k].tree.Powers[h].PowerIndex] : -1);
			}

			k++;
		}

		return true;
	};

	this.getPower = function(powerName) {
		var gm, gp, pm, pt, i;

		if (this.aggregate)
		{
			gp = this.globalPowerNamesIndex[powerName];
			if (gp !== undefined)
			{
				return this.tree[gp[0]].tree.Powers[gp[1]];
			}

			for (i=0 ; i<this.tree.length ; i++)
			{
				pm = this.tree[i].tree.Powers[this.tree[i].powerNamesIndex[powerName]];
				if (pm === undefined) pm = null;

				if (pm !== null) return pm;
			}

			return null;
		}

		pm = this.tree.Powers[this.powerNamesIndex[powerName]];
		pt = ((this.trunk !== null) ? this.trunk.tree.Powers[this.trunk.powerNamesIndex[powerName]] : null);

		if (pm === undefined) pm = null;

		if (pm !== null) return pm;
		if (pt !== null) return pt;

		return null;
	};

	this.appendTrunkSet = function(trunkSetDB) {
		this.trunk = trunkSetDB;
	};

	this._loadFile = function(file, tx) {
		// Class_Arachnos_Soldier_Arachnos_Soldiers.Bane_Spider_Soldier.json
		// Class_Arachnos_Arachnos_Soldiers.Bane_Spider_Soldier
		if (tx === false)
		{
			if (!fs.existsSync(file)) return false;
		}

		this.file = file;
		try
		{
			this.tree = JSON.parse(fs.readFileSync(this.file));
			this._populatePowerNamesIndex();

			return true;
		}
		catch (ex)
		{
			console.log('Could not load powerset file ' + file);
			console.log(ex);

			return false;
		}
	};

	this._populatePowerNamesIndex = function() {
		var i;
		if (this.tree.Power !== undefined)
		{
			for (i=0 ; i<this.tree.Power.length ; i++)
			{
				this.IDIndex[this.tree.Power[i]] = i;
			}
		}

		this.powerNamesIndex.length = 0;
		for (i=0 ; i<this.tree.Powers.length ; i++)
		{
			this.powerNamesIndex[this.tree.Powers[i].DisplayName] = i;
			this.powerNamesIndex.length++;
			this.tree.Powers[i]._indexInSet = ((this.tree.Power !== undefined) ? this.IDIndex[this.tree.Powers[i].PowerIndex] : -1);
		}
	};

	this._generateJsonDBPowersetIdentifier = function(at, specType, specName, includeDir) {
		var specTypeTranslation;
		switch (at)
		{
			case 'Blaster':
				specTypeTranslation = {primary: 'Blaster_Ranged', secondary: 'Blaster_Support'}; break;

			case 'Brute':
				specTypeTranslation = {primary: 'Brute_Melee', secondary: 'Brute_Defense'}; break;

			case 'Controller':
				specTypeTranslation = {primary: 'Controller_Control', secondary: 'Controller_Buff'}; break;

			case 'Corruptor':
				specTypeTranslation = {primary: 'Corruptor_Ranged', secondary: 'Corruptor_Buff'}; break;

			case 'Defender':
				specTypeTranslation = {primary: 'Defender_Buff', secondary: 'Defender_Ranged'}; break;

			case 'Dominator':
				specTypeTranslation = {primary: 'Dominator_Control', secondary: 'Dominator_Assault'}; break;

			case 'Mastermind':
				specTypeTranslation = {primary: 'Mastermind_Summon', secondary: 'Mastermind_Buff'}; break;

			case 'Peacebringer':
				specTypeTranslation = {primary: 'Peacebringer_Offensive', secondary: 'Peacebringer_Defensive'}; break;

			case 'Scrapper':
				specTypeTranslation = {primary: 'Scrapper_Melee', secondary: 'Scrapper_Defense'}; break;

			case 'Sentinel':
				specTypeTranslation = {primary: 'Sentinel_Ranged', secondary: 'Sentinel_Defense'}; break;

			case 'Stalker':
				specTypeTranslation = {primary: 'Stalker_Melee', secondary: 'Stalker_Defense'}; break;

			case 'Tanker':
				specTypeTranslation = {primary: 'Tanker_Defense', secondary: 'Tanker_Melee'}; break;

			case 'Warshade':
				specTypeTranslation = {primary: 'Warshade_Offensive', secondary: 'Warshade_Defensive'}; break;

			case 'Arachnos Soldier':
				specTypeTranslation = {primary: 'Arachnos_Soldiers', secondary: 'Training_Gadgets'}; break;

			case 'Arachnos Widow':
				specTypeTranslation = {primary: 'Widow Training', secondary: 'Teamwork'}; break;
		}

		specTypeTranslation.getSpecIdentifier = function(specType) {
			var st = specType.toLowerCase();

			if (st == 'primary') return this.primary;
			else if (st == 'secondary') return this.secondary;
			else return null;
		};

		var specID = locutus.php.ucwords(specTypeTranslation.getSpecIdentifier(specType));
		if (specID === null) return null;

		return ((includeDir === true) ? this.playerSpecsDir + '/' : '') + 'Class_' + locutus.php.ucwords(at).replace(/\s/g, '_') + '_' + specID.replace(/\s/g, '_') + '.' + locutus.php.ucwords(specName).replace(/\s/g, '_' ) + '.json';
	};
};