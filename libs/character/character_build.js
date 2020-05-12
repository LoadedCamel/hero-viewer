'use strict';

const appPaths        = require('../environ/paths.js');
const locutus         = require('../locutus_php/locutus_php.js');
const cPowersDB       = require('../mhd_db/powers/powers_db.js');
const cEnhancementsDB = require('../mhd_db/enhancements/enhancements_db.js');

module.exports = class {
	constructor() {
		this.builder      = { product: null, version: null };
		this.sourceBuild  = null;
		this.alignment    = null; // Hero|Villain
		this.name         = null;
		this.level        = null;
		this.origin       = null;
		this.at           = null;
		this.powersets    = []; // [Primary, Secondary]
		this.powersetsDB  = [];
		this.powerPools   = []; // Pools + Ancillary/Epic Pools
		this.powers       = [];
		this.powersIndex  = {};
		this.accolades    = [];
		this.incarnates   = {};
		this.importFields = ['builder', 'sourceBuild', 'alignment', 'name', 'level', 'origin', 'at', 'powersets', 'powerPools', 'powers', 'powersIndex', 'accolades', 'incarnates', 'counters'];
		this.counters     = { enhancements: 0, enhcheck: 0, catalysts: 0, boosters: 0 };
	}

	/////////////////////////////////////////
	// Setters

	setBuildSource(mxdBuildContent) {
		this.sourceBuild = mxdBuildContent;
	}

	setVariables(identifiers, values) {
		var i, k, v;
		for (i=0 ; i<identifiers.length ; i++)
		{
			k = identifiers[i];
			v = values[i];

			switch (k)
			{
				case 'powersets':
				case 'powerPools':
				case 'powers':
					break;

				case 'builderProduct':
					v = locutus.php.strReplace(
						['Mids\' Reborn : ', 'Hero Hero Designer'],
						['Mids\' Reborn: ',  'Pine Hero Designer'],
						v
					);

					this.builder.product = v;
					break;

				case 'builderVersion':
					this.builder.version = v;
					break;

				case 'alignment':
					if ((this.builder.product !== null) && (v.toLowerCase() == 'villain'))
					{
						this.builder.product.replace('Hero', 'Villain');
					}
					break;

				default:
					if (this[k] !== undefined) this[k] = v;
			}
		}
	}

	setPowerset(type, powerset) {
		type = type.toLowerCase();

		if (type == 'primary')   this.powersets[0] = powerset;
		if (type == 'secondary') this.powersets[1] = powerset;
	};

	addPool(type, poolSet) {
		if (type == 'Power') type = 'Pool';
		this.powerPools[this.powerPools.length] = {type: type, poolSet: poolSet};
	};

	addPower(name, level, slots) {
		var i = this.powers.length;
		this.powers[i] = {
			name:         name,
			level:        level,
			slots:        slots,
			data:         null,
			recipe:       null,
			enhCheckList: ((slots !== null) ? locutus.php.arrayFill(0, slots.length, false) : null)
		};

		this.powersIndex[name] = i;
	};

	/////////////////////////////////////////
	// Linkers to DB

	_linkPowersetsToDB(primaryPowersetDB, secondaryPowersetDB) {
		var i, p, s, t, edb;

		t = null;
		edb = [null, null];

		if      (this.at == 'Arachnos Soldier') t = {primary: 'Arachnos_Soldier', secondary: 'Training_and_Gadgets'};
		else if (this.at == 'Arachnos Widow')   t = {primary: 'Widow_Training',   secondary: 'Teamwork'};


		if (t !== null)
		{
			if (this.powersets[0] != t.primary)
			{
				this.powersets[0] = [t.primary.replace(/\_/g, ' '), this.powersets[0]];
				edb[0] = new cPowersDB(appPaths.mainDir, appPaths.playerSpecDir);
				edb[0].load(this.at, 'primary', t.primary);
				primaryPowersetDB.appendTrunkSet(edb[0]);
			}

			if (this.powersets[1] != t.secondary)
			{
				this.powersets[1] = [t.secondary.replace(/\_/g, ' '), this.powersets[1]];
				edb[1] = new cPowersDB(appPaths.mainDir, appPaths.playerSpecDir);
				edb[1].load(this.at, 'secondary', t.secondary);
				secondaryPowersetDB.appendTrunkSet(edb[1]);
			}
		}

		for (i=0 ; i<this.powers.length ; i++)
		{
			p = primaryPowersetDB.getPower(this.powers[i].name);
			if (p !== null)
			{
				this.powers[i].data = p;
				continue;
			}

			s = secondaryPowersetDB.getPower(this.powers[i].name);
			if (s !== null)
			{
				this.powers[i].data = s;
				continue;
			}
		}

		this.powersetsDB[0] = primaryPowersetDB;
		this.powersetsDB[1] = secondaryPowersetDB;
	};

	_linkEnhancementsToDB(enhancementsDB, recipesDB, salvagesDB) {
		var i, j, enhNameChunks, enhData;

		for (i=0 ; i<this.powers.length ; i++)
		{
			if (this.powers[i].slots === null) continue;
			for (j=0 ; j<this.powers[i].slots.length ; j++)
			{
				if (this.powers[i].slots[j].base == null) continue;

				// Gaussian's use 2 dashes (--) as separator (first is part of set ShortName!)
				enhNameChunks = [this.powers[i].slots[j].base, this.powers[i].slots[j].subMember];
				enhData = enhancementsDB.fetchEnhancement(enhNameChunks[0], enhNameChunks[1]);
				if (enhData !== null)
				{
					this.powers[i].slots[j].data = enhData;
					// Superior ATO sets use a catalyst by default
					if (/^Superior/.test(enhData.LongName)) this.powers[i].slots[j].catalysis = true;
					this.powers[i].slots[j].recipe = ((enhData.RecipeIDX < 0) ? null : recipesDB.getRecipeByIdLevel(enhData.RecipeIDX, 'max', salvagesDB));
					// Attempt to update and fix old build data by matching ShortNames
					if (enhNameChunks.join('-') != enhNameChunks[0] + '-' + enhData.ShortName)
					{
						this.powers[i].slots[j].subMember = enhData.ShortName;
					}
				}
			}
		}
	};

	_linkPoolsToDB(poolsDir, playerSpecDir) {
		var poolsList = this.getPowersets('pools');
		var i, j, p, ret, poolPowers;
		for (i=0 ; i<poolsList.powerPools.length ; i++)
		{
			poolPowers = new cPowersDB(poolsDir, playerSpecDir);
			ret = poolPowers.loadPool(this.getAT(), poolsList.powerPools[i].type, poolsList.powerPools[i].poolSet);
			if (ret) poolsList.powerPools[i].data = poolPowers;

			for (j=0 ; j<poolPowers.tree.Powers.length ; j++)
			{
				var p = this.getPowerByName(poolPowers.tree.Powers[j].DisplayName);
				if (p !== null) p.data = poolPowers.tree.Powers[j];
			}
		}

		this.powerPools = poolsList.powerPools;
	};

	_linkAccoladesToDB(poolsDir, playerSpecDir) {
		var accoladesPowers = new cPowersDB(poolsDir, playerSpecDir);
		var ret = accoladesPowers.loadAccolades();
		var p;
		for (var i=0 ; i<this.powers.length ; i++)
		{
			p = accoladesPowers.getPower(this.powers[i].name);
			if (p !== null)
			{
				this.accolades[this.accolades.length] = { name: this.powers[i].name, data: p };
				this.powers[i].data = p;
			}
		}
	};

	_linkInherentFitnessToDB(poolsDir, playerSpecDir) {
		var fitnessPowers = new cPowersDB(poolsDir, playerSpecDir);
		var ret = fitnessPowers.loadFitnessPowers();
		var p;
		var powers = ['Swift', 'Hurdle', 'Health', 'Stamina'];
		for (var i=0 ; i<powers.length ; i++)
		{
			p = fitnessPowers.getPower(powers[i]);
			this.getPowerByName(powers[i]).data = p;
		}
	}

	_linkInherentsToDB(poolsDir, playerSpecDir) {
		var inherentPowers = new cPowersDB(poolsDir, playerSpecDir);
		var ret = inherentPowers.loadInherents();
		var p;
		for (var i=0 ; i<this.powers.length ; i++)
		{
			p = inherentPowers.getPower(this.powers[i].name);
			if (p !== null) this.getPowerByName(this.powers[i].name).data = p;
		}
	}

	_linkIncarnatesToDB(poolsDir, playerSpecDir) {
		var incarnatePowers = new cPowersDB(poolsDir, playerSpecDir);
		var ret = incarnatePowers.loadIncarnates();
		var p;
		for (var i=0 ; i<this.powers.length ; i++)
		{
			p = incarnatePowers.getPower(this.powers[i].name);
			if (p !== null) this.getPowerByName(this.powers[i].name).data = p;
		}
	}

	_initCounters() {
		var i, j;
		var c = 0, e = 0;

		for (i=0 ; i<this.powers.length ; i++)
		{
			// Skip unslottable powers (inherents, incarnate, etc.)
			if (!this.powers[i].slots || !this.powers[i].slots.length) continue;

			for (j=0 ; j<this.powers[i].slots.length ; j++)
			{
				if (!this.powers[i].slots[j].data) continue;
				if (this.powers[i].slots[j].data === null) continue;

				e++;

				if (
					(
					cEnhancementsDB.isNaturallyAttuned(this.powers[i].slots[j].data) &&
					cEnhancementsDB.isSuperiorE(this.powers[i].slots[j].data)
				) ||
					this.powers[i].slots[j].catalysis
				)
					c++;
			}
		}

		this.counters.enhancements = e;
		this.counters.catalysts    = c;
	};

	linkAllToDB(enhDB, recipesDB, salvagesDB, mainDir, playerSpecDir, poolsDir) {
		var mainPowersets = this.getPowersets('main');

		var primarySpecDB = new cPowersDB(mainDir, playerSpecDir);
		var retP = primarySpecDB.load(this.getAT(), 'primary', mainPowersets.powersets.primary);

		var secondarySpecDB = new cPowersDB(mainDir, playerSpecDir);
		var retS = secondarySpecDB.load(this.getAT(), 'secondary', mainPowersets.powersets.secondary);

		if (retP && retS)
		{
			this._linkPowersetsToDB(primarySpecDB, secondarySpecDB);
		}

		this._linkEnhancementsToDB(enhDB, recipesDB, salvagesDB);
		this._linkPoolsToDB(poolsDir, playerSpecDir);
		this._linkAccoladesToDB(poolsDir, playerSpecDir);
		this._linkInherentFitnessToDB(poolsDir, playerSpecDir);
		this._linkInherentsToDB(poolsDir, playerSpecDir);
		this._linkIncarnatesToDB(poolsDir, playerSpecDir);

		this._reindexPowers();
		this._initCounters();
	};

	/////////////////////////////////////////
	// Getters

	isHero() {
		return this.alignment == 'hero';
	}

	isVillain() {
		return this.alignment == 'villain';
	}

	isBlueSide() {
		return this.isHero();
	}

	isRedSide() {
		return this.isVillain();
	}

	getPowersets(filter, fullOutput) {
		if (fullOutput === undefined) fullOutput = false;

		switch (filter)
		{
			case 'main':
				if (!fullOutput)
				{
					return {powersets: {primary: this.powersets[0], secondary: this.powersets[1]}};
				}
				else
				{
					return {powersets: {primary: {name: this.powersets[0], data: this.powersetsDB[0]}, secondary: {name: this.powersets[1], data: this.powersetsDB[1]}}};
				}

				break;

			case 'pool':
			case 'pools':
				return {powerPools: this.powerPools};

				break;

			case undefined:
			case null:
			case 'all':
				if (!fullOutput)
				{
					return {
						powersets:  {primary: this.powersets[0], secondary: this.powersets[1]},
						powerPools: this.powerPools
					};
				}
				else
				{
					return {
						powersets: {primary: {name: this.powersets[0], data: this.powersetsDB[0]}, secondary: {name: this.powersets[1], data: this.powersetsDB[1]}},
						powerPools: this.powerPools
					};
				}

				break;

			default:
				return null;
		}
	}

	getPowersetsShort() {
		var specs = this.getPowersets('main', false);
		if (typeof specs.powersets.primary   == 'object') specs.powersets.primary   = specs.powersets.primary[1];
		if (typeof specs.powersets.secondary == 'object') specs.powersets.secondary = specs.powersets.secondary[1];

		return specs;
	};

	getPickedPowersInSets() {
		var i, j, pn;
		var ret = {primary: {}, secondary: {}, trunks: null, pools: {}};

		if ((this.at == 'Arachnos Soldier') || (this.at == 'Arachnos Widow'))
		{
			ret.trunks = {primary: null, secondary: null};
		}

		if (this.powersetsDB[0].trunk !== null)
		{
			ret.trunks.primary = {};
			for (i=0 ; i<this.powersetsDB[0].trunk.tree.Powers.length ; i++)
			{
				pn = this.powersetsDB[0].trunk.tree.Powers[i].DisplayName;
				ret.trunks.primary[pn] = this.hasPower(pn);
			}
		}

		if (this.powersetsDB[1].trunk !== null)
		{
			ret.trunks.secondary = {};
			for (i=0 ; i<this.powersetsDB[1].trunk.tree.Powers.length ; i++)
			{
				pn = this.powersetsDB[1].trunk.tree.Powers[i].DisplayName;
				ret.trunks.secondary[pn] = this.hasPower(pn);
			}
		}

		for (i=0 ; i<this.powersetsDB[0].tree.Powers.length ; i++)
		{
			pn = this.powersetsDB[0].tree.Powers[i].DisplayName;
			ret.primary[pn] = this.hasPower(pn);
		}

		for (i=0 ; i<this.powersetsDB[1].tree.Powers.length ; i++)
		{
			pn = this.powersetsDB[1].tree.Powers[i].DisplayName;
			ret.secondary[pn] = this.hasPower(pn);
		}

		for (i=0 ; i<this.powerPools.length ; i++)
		{
			for (j=0 ; j<this.powerPools[i].data.tree.Powers.length ; j++)
			{
				if (ret.pools[i] === undefined)
				{
					ret.pools[i] = {name: this.powerPools[i].poolSet, type: this.powerPools[i].type};
				}

				pn = this.powerPools[i].data.tree.Powers[j].DisplayName;
				ret.pools[i][pn] = this.hasPower(pn);
			}
		}

		return ret;
	}

	getAT() {
		return this.at;
	}

	getCharacterID() {
		return {
			name:      this.name,
			at:        this.at,
			alignment: this.alignment,
			origin:    this.origin,
			level:     this.level
		};
	}

	getPowerByIndex(i) {
		var ret = this.powers[i];

		return ((ret === undefined) ? null : ret);
	}

	getPowerByName(powerName) {
		var ret = this.powers[this.powersIndex[powerName]];

		return ((ret === undefined) ? null : ret);
	}

	getPowersCount() {
		return this.powers.length;
	}

	hasPower(powerName) {
		return ((this.powers[this.powersIndex[powerName]] === undefined) ? false : true);
	}

	importObjectProperties(oData) {
		var i;

		for (i in oData)
		{
			if (typeof oData[i] == 'function') continue;
			if (this[i] === undefined) continue; // ???
			this[i] = oData[i];
		}
	}

	_reindexPowers() {
		this.powers = this.powers.sort((a, b) => {
			/* Re-sort powers
			- Level ASC
			- Primary spec before secondary spec (?)
			- power._indexInSet
			- Name ASC (DisplayName)
			*/

			if (a.level < b.level) return -1;
			if (a.level > b.level) return 1;

			// Warning: Specializations for Widow are not linked to any data
			var sidx_a = ((a.data !== undefined && a.data !== null && a.data.hasOwnProperty('_indexInSet')) ? a.data._indexInSet : -1);
			var sidx_b = ((b.data !== undefined && b.data !== null && b.data.hasOwnProperty('_indexInSet')) ? b.data._indexInSet : -1);

			var incs_a = ((a.data !== undefined && a.data !== null && a.data.hasOwnProperty('_incarnateSlotIndex')) ? a.data._incarnateSlotIndex : -1);
			var incs_b = ((b.data !== undefined && b.data !== null && b.data.hasOwnProperty('_incarnateSlotIndex')) ? b.data._incarnateSlotIndex : -1);

			if (incs_a < incs_b) return -1;
			if (incs_a > incs_b) return 1;

			if (sidx_a < sidx_b) return -1;
			if (sidx_a > sidx_b) return 1;

			if (a.name < b.name) return -1;
			return 1;
		});

		this.powersIndex = {};
		for (var i=0 ; i<this.powers.length ; i++)
		{
			this.powersIndex[this.powers[i].name] = i;
		}
	}

	export() {
		var i, j;

		// Kaminoans didn't allow us to clone objects...
		var coreBuildData = Object.create(this);

		coreBuildData.builder     = this.builder;
		coreBuildData.sourceBuild = this.sourceBuild;
		coreBuildData.alignment   = this.alignment;
		coreBuildData.name        = this.name;
		coreBuildData.level       = this.level;
		coreBuildData.origin      = this.origin;
		coreBuildData.at          = this.at;
		coreBuildData.powersets   = this.powersets;
		coreBuildData.powerPools  = this.powerPools;
		coreBuildData.powers      = this.powers;
		coreBuildData.powersIndex = this.powersIndex;
		coreBuildData.accolades   = this.accolades;
		coreBuildData.incarnates  = this.incarnates;
		coreBuildData.counters    = this.counters;

		// Nullify all data attributes.
		// They are parsed on build or config load.
		for (i=0 ; i<coreBuildData.powers.length ; i++)
		{
			coreBuildData.powers[i].data = null;
			if (coreBuildData.powers[i].slots !== null)
			{
				for (j=0 ; j<coreBuildData.powers[i].slots.length ; j++)
				{
					coreBuildData.powers[i].slots[j].data   = null;
					coreBuildData.powers[i].slots[j].recipe = null;
				}
			}
		}

		for (i=0 ; i<coreBuildData.powerPools.length ; i++)
		{
			coreBuildData.powerPools[i].data = null;
		}

		for (i=0 ; i<coreBuildData.accolades.length ; i++)
		{
			coreBuildData.accolades[i].data = null;
		}

		return JSON.stringify(coreBuildData, null, 2);
	}
};