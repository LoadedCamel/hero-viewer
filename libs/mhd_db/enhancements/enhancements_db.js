'use strict';

const os = require('os');
const fs = require('fs');
const locutus = require('../../locutus_php/locutus_php.js');

module.exports = class {
	constructor() {
		this.file = null;
		this.tree = null;
		this.setsIndex = {};
		this.setsNIDIndex = {};
		this.setsUIDIndex = {};
		this.enhancementsIndex = [];
		this.regEnhancements = {};
	}

	load(dir) {
		var file = dir + '/EnhDB.json';
		if (!fs.existsSync(file))
		{
			console.log('EnhDB.json missing !');
			return false;
		}

		this.file = file;
		this.tree = JSON.parse(fs.readFileSync(this.file));

		this._populateEnhancementsIndex();
		this._populateSetsIndex();

		return true;
	}

	fetchEnhancementById(id) {
		if (this.enhancementsIndex.length == 0) return null;
		if (this.enhancementsIndex[id] === undefined) return null;

		return this.enhancementsIndex[id];
	}

	fetchEnhancement(group, memberIdentifier) {
		if (group == 'Empty') return null;

		var regE, setE;

		// For Hamidon/Hydra/Titan Origin: remove prefix, use name after colon as group identifier
		if (/^(HO|HY|TN)\:/.test(group))
		{
			var chunks = group.split(/\:/g);
			group = chunks[1];
			switch (chunks[0])
			{
				case 'HO':
					memberIdentifier = 'Hamidon';
					break;

				case 'HY':
					memberIdentifier = 'Hydra';
					break;

				case 'TN':
					memberIdentifier = 'Titan';
					break;

				default:
					memberIdentifier = null;
			}
		}

		if ((this._regularEnhancementGroupExists(group)) && (group == memberIdentifier)) memberIdentifier = 'I';
		regE = this._fetchRegularEnhancement(group, memberIdentifier);
		if (regE !== null) return regE;

		// Round 2 of fixes for old identifiers.
		// See also: plain_text_parser.js // this._oldSetNames .
		if ((group == 'Prv') && (memberIdentifier == 'Heal/EndMod')) memberIdentifier = 'Heal/EndRdx';
		if ((group == 'SprWntBit') && (memberIdentifier == 'Acc/Dmg/EndRdx/Rchg')) memberIdentifier = 'Dmg/EndRdx/Acc/Rchg';

		setE = this._fetchSetEnhancement(group, memberIdentifier);
		if (setE !== null) return setE;

		console.log(group + ' ' + memberIdentifier);

		return null;
	}

	fetchSetByName(setName) {
		if (this.setsIndex[setName] === undefined) return null;

		return this.setsIndex[setName];
	}

	fetchSetById(setNID) {
		if (this.setsNIDIndex[setNID] === undefined) return null;

		return this.setsNIDIndex[setNID];
	}

	fetchSetByUID(setUID) {
		if (this.setsUIDIndex[setUID] === undefined) return null;

		return this.setsUIDIndex[setUID];
	}

	_regularEnhancementGroupExists(group) {
		return (this.regEnhancements[group] !== undefined);
	};

	_fetchRegularEnhancement(group, origin) {
		if (this.regEnhancements[group] === undefined) return null;
		if (this.regEnhancements[group][origin] === undefined) return null;

		return this.regEnhancements[group][origin];
	}

	_fetchSetEnhancement(setName, memberIdentifier) {
		if (this.setsIndex[setName] === undefined) return null;
		//console.log('--------------------------------------');
		//console.log(this.setsIndex[setName].enhancements);
		//console.log('--------------------------------------');
		if (this.setsIndex[setName].enhancements[memberIdentifier] === undefined)
		{
			// Names may differ slightly between versions.
			// E.g. Luck of the Gambler: Defense/Increased Global Recharge speed
			// ShortName in Pine Hero Designer: Rchg+
			// ShortName in Mids' Reborn: Def/Rchg+

			for (var e in this.setsIndex[setName].enhancements)
			{
				if (locutus.php.strpos(e, memberIdentifier) !== false)
				{
					return this.setsIndex[setName].enhancements[e];
				}
			}

			return null;
		}

		return this.setsIndex[setName].enhancements[memberIdentifier];
	}

	// regEnhancements:
	// enhancement[ShortName][Origin] = enhancementData
	_populateRegEnhancementsIndexAtom(enhData) {
		var uidChunks = enhData.UID.split(/\_/g); // [Origin, FullName]
		var origin = uidChunks[0];
		switch (origin)
		{
			case 'Crafted':
				origin = 'I';
				break;

			case 'Magic':
				origin = 'SO'; // ??
				break;
		}

		if (this.regEnhancements[enhData.ShortName] === undefined)
		{
			this.regEnhancements[enhData.ShortName] = {length: 0};
			this.regEnhancements.length++;
		}

		this.regEnhancements[enhData.ShortName][origin] = enhData;
		this.regEnhancements[enhData.ShortName].length++;
	}

	// enhancement[StaticIndex] => {enhancementData}, isInSet
	_populateEnhancementsIndex() {
		var i, index;

		this.regEnhancements.length = 0;
		for (i=0 ; i<this.tree.Enhancements.length ; i++)
		{
			var index = this.tree.Enhancements[i].StaticIndex;
			this.enhancementsIndex[index] = {data: this.tree.Enhancements[i], setE: (this.tree.Enhancements[i].UIDSet != '')};

			if (this.tree.Enhancements[i].UIDSet == '')
			{
				// Add to Regular Enhancements
				// regEnhancements[shortName][origin] = data
				// (shortName + UID)

				this._populateRegEnhancementsIndexAtom(this.tree.Enhancements[i]);
			}
		}
	}

	// setShortName => {index, [enhancements]}
	_populateSetsIndex() {
		var i, j, enhList, setName;

		this.setsIndex.length = 0;
		this.setsNIDIndex.length = 0;
		for (var i=0 ; i<this.tree.EnhancementSets.length ; i++)
		{
			this.setsIndex.length++;
			setName = locutus.php.rtrim(this.tree.EnhancementSets[i].ShortName, '-');
			//console.log(setName);
			if (this.tree.EnhancementSets[i].Enhancements !== undefined)
			{
				enhList = {};
				for (j=0 ; j<this.tree.EnhancementSets[i].Enhancements.length ; j++)
				{
					//console.log(this.tree.EnhancementSets[i].Enhancements[j]);
					//console.log(this.enhancementsIndex[this.tree.EnhancementSets[i].Enhancements[j]]);
					//console.log(i + ', ' + j);
					//console.log(this.enhancementsIndex[this.tree.EnhancementSets[i].Enhancements[j]].data.ShortName);
					//console.log('--------');
					enhList[this.enhancementsIndex[this.tree.EnhancementSets[i].Enhancements[j]].data.ShortName] = this.enhancementsIndex[this.tree.EnhancementSets[i].Enhancements[j]].data;
				}
				enhList.length = this.tree.EnhancementSets[i].Enhancements.length;

				this.setsIndex[setName] = {
					index: i,
					name: this.tree.EnhancementSets[i].DisplayName,
					enhancementsID: this.tree.EnhancementSets[i].Enhancements,
					enhancements: enhList,
					UID: this.tree.EnhancementSets.Uid,
					Bonuses: this.tree.EnhancementSets[i].Bonus,
					SpecialBonuses: this.tree.EnhancementSets[i].SpecialBonus
				};

				this.setsNIDIndex[this.setsNIDIndex.length++] = {
					index: i,
					name: this.tree.EnhancementSets[i].DisplayName,
					enhancementsID: this.tree.EnhancementSets[i].Enhancements,
					enhancements: enhList,
					UID: this.tree.EnhancementSets.Uid,
					Bonuses: this.tree.EnhancementSets[i].Bonus,
					SpecialBonuses: this.tree.EnhancementSets[i].SpecialBonus
				};

				this.setsUIDIndex[this.setsUIDIndex.length++] = {
					index: i,
					name: this.tree.EnhancementSets[i].DisplayName,
					enhancementsID: this.tree.EnhancementSets[i].Enhancements,
					enhancements: enhList,
					UID: this.tree.EnhancementSets.Uid,
					Bonuses: this.tree.EnhancementSets[i].Bonus,
					SpecialBonuses: this.tree.EnhancementSets[i].SpecialBonus
				}
			}
			else
			{
				this.setsIndex[setName] = {
					index: i,
					name: this.tree.EnhancementSets[i].DisplayName,
					enhancementsID: [],
					enhancements: [],
					UID: this.tree.EnhancementSets.Uid,
					Bonuses: this.tree.EnhancementSets[i].Bonus,
					SpecialBonuses: this.tree.EnhancementSets[i].SpecialBonus
				};

				this.setsNIDIndex[this.setsNIDIndex.length++] = {
					index: i,
					name: this.tree.EnhancementSets[i].DisplayName,
					enhancementsID: [],
					enhancements: [],
					UID: this.tree.EnhancementSets.Uid,
					Bonuses: this.tree.EnhancementSets[i].Bonus,
					SpecialBonuses: this.tree.EnhancementSets[i].SpecialBonus
				};

				this.setsUIDIndex[this.setsUIDIndex.length++] = {
					index: i,
					name: this.tree.EnhancementSets[i].DisplayName,
					enhancementsID: [],
					enhancements: [],
					UID: this.tree.EnhancementSets.Uid,
					Bonuses: this.tree.EnhancementSets[i].Bonus,
					SpecialBonuses: this.tree.EnhancementSets[i].SpecialBonus
				};
			}
		}
	}

	// ///////////// Enhancement type detection ///////////// //

	static isATO(enhData) {
		if (!enhData.SetType) return false;

		return ((enhData.SetType >= 32) && (enhData.SetType <= 43));
	}

	static isWinterEventE(enhData) {
		if (!enhData.LongName) return false;

		return /(Avalanche|Blistering Cold|Entomb|Frozen Blast|Winter\'s Bite)/.test(enhData.LongName);
	}

	static isMovieE(enhData) {
		if (!enhData.LongName) return false;

		return /Overwhelming Force/.test(enhData.LongName);
	}

	static isIO(enhData) {
		if (!enhData.UID) return false;

		return (/Crafted\_/.test(enhData.UID));
	}

	// ///////////// Enhancement Catalyst management ///////////// //

	// Enh for which a catalyst can be used on OR has been used on already
	// All ATOs, Winter Event sets, all IOs but regular (white grade) ones
	static canReceiveCatalyst(enhData) {
		if (!enhData.UID) return false;

		return (this.isATO(enhData) || this.isWinterEventE(enhData) || (/Crafted\_/.test(enhData.UID) && (enhData.nIDSet > -1)));
	}

	// Superior Enhancement
	// Superior ATO sets, Superior Winter Event sets, purple grade sets
	static isSuperiorE(enhData, recipeData={}) {
		if (!enhData.LongName) return false;
		var rarity = ((recipeData.rarity) ? recipeData.rarity : 0);

		return (/^Superior/.test(enhData.LongName) || (rarity == 3));
	}

	// Enh coming naturally attuned
	// All ATOs, Winter Event sets, Overwhelming Force
	static isNaturallyAttuned(enhData) {
		if (!enhData.LongName) return false;

		return (this.isATO(enhData) || this.isWinterEventE(enhData) || this.isMovieE(enhData));
	}

	// Enh + catalyst = Superior Enh
	// Basic ATOs, Basic Winter Event sets or purple grade sets
	static canCatalystUpgradeSuperior(enhData, recipeData={}) {
		if (!enhData.LongName) return false;
		var rarity = ((recipeData.rarity) ? recipeData.rarity : 0);

		return ((this.isATO(enhData) || this.isWinterEventE(enhData) || (rarity == 3)) && !/^Superior/.test(enhData.LongName));
	}

	// ///////////// Enhancement Booster management ///////////// //

	// Enh which can receive boosters
	// All crafted IOs
	static canReceiveBoosters(enhData) {
		return this.isIO(enhData);
	}
};