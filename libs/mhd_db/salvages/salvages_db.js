'use strict';

const fs = require('fs');

module.exports = function() {
	this.file = null;
	this.tree = null;

	this.load = function(dir) {
		var file = dir + '/Salvage.json';
		if (!fs.existsSync(file)) return false;

		this.file = file;
		this.tree = JSON.parse(fs.readFileSync(this.file));

		return true;
	};

	this.rarityClass = function(rarity) {
		switch (parseInt(rarity))
		{
			case 1: return  'uncommon';
			case 2: return  'rare';
			case 3: return  'veryrare';
			default: return 'common';
		}
	};

	this.getSalvageById = function(id) {
		var s = this.tree.Salvage[id];
		if (s === undefined) return null;

		return {name: s.ExternalName, rarity: ((s.Rarity !== undefined) ? s.Rarity : 0)};
	};
};