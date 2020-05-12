'use strict';

const fs = require('fs');

module.exports = function() {
	this.file = null;
	this.tree = null;

	this.load = function(dir) {
		var file = dir + '/Recipe.json';
		if (!fs.existsSync(file)) return false;

		this.file = file;
		this.tree = JSON.parse(fs.readFileSync(this.file));

		return true;
	};

	this.rarityClass = function(rarity) {
		switch (parseInt(rarity))
		{
			case 1:  return 'uncommon';
			case 2:  return 'rare';
			case 3:  return 'veryrare';
			case 4:  return 'specialO';
			default: return 'common';
		}
	};

	this.getRecipeByIdLevel = function(id, level, salvagesDB) {
		var r = this.tree.Recipes[id];
		var s, i, l, c, sl;

		if (r === undefined) return null;

		if ((level == 'max') || (level == 'auto')) level = 50;
		if (level == 'min')
		{
			s = r.Item[0];
			l = r.Item[0].Level;
			c = r.item[0].CraftCost;
		}
		else
		{
			for (i=0 ; i<r.Item.length ; i++)
			{
				if ((r.Item[i].Level + 1 == level) || (i == r.Item.length - 1))
				{
					s = r.Item[i];
					l = r.Item[i].Level;
					c = r.Item[i].CraftCost;
					break;
				}
			}
		}

		sl = [];
		for (i=0 ; i<s.SalvageIdx.length ; i++)
		{
			if (s.SalvageIdx[i] >= 0) sl[i] = salvagesDB.getSalvageById(s.SalvageIdx[i]);
		}

		return {
			name: r.ExternalName,
			salvage: sl,
			level: l + 1,
			craftCost: c,
			rarity: r.Rarity
		};

		// level = min: minimum available
		// level = max: maximum available (<= 50)
		// level = auto: maximum available (<= 50)
	};
};