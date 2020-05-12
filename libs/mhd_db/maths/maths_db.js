'use strict';

const fs   = require('fs');
const path = require('path');
//const locutus = require('../../locutus_php/locutus_php.js');

module.exports = class {
	file;
	tree;

	constructor() {
		this.file = null;
		this.tree = null;
	}

	load() {
		var file = path.join(__dirname, 'MathsDB.json');
		if (!fs.existsSync(file)) return false;

		this.file = file;
		this.tree = JSON.parse(fs.readFileSync(this.file));

		return true;
	}

	schedToIndex(sched) {
		switch(sched.toUpperCase())
		{
			case 'A': return 0;
			case 'B': return 1;
			case 'C': return 2;
			case 'D': return 3;
		}
	}

	// From MHD/Source/Base/Enhancement.cs l409
	applyED(sched, val) {
		var ed = [0, 0, 0];
		var i;
		for (i=0 ; i<3 ; i++)
		{
			ed[i] = this.multED[index + 1][sched]; // ???
		}

		if (val <= ed[0]) return val;

		var edm = [
			ed[0],
			ed[0] + (ed[1] - ed[0]) * 0.899999976158142,
			ed[0] + (ed[1] - ed[0]) * 0.899999976158142 + (ed[2] - ed[1]) * 0.699999988079071;
		];

		if (val > ed[1])
		{
			if (val > ed[2])
			{
				return edm[2] + (val - ed[2]) * 0.150000005960464;
			}
			else
			{
				return edm[1] + (val - ed[1]) * 0.699999988079071;
			}
		}
		else
		{
			return edm[0] + (val - ed[0]) * 0.899999976158142;
		}
	}

	////////////////////////////////////////////

	multED(thresh, sched) {
		var schedIndex = ((typeof sched == 'number') ? sched : this.schedToIndex(sched));
		var ret;
		try
		{
			ret = this.parent.tree.EDRT['EDThresh_' + thresh][schedIndex];
		}
		catch(ex)
		{
			return null;
		}

		if (ret === undefined) return null;

		return ret;
	}

	this.getEGE(enhType, sched) {
		var ret;
		var schedIndex = ((typeof sched == 'number') ? sched : this.schedToIndex(sched));
		try
		{
			ret = this.parent.tree.EGE[enhType][schedIndex];
		}
		catch(ex)
		{
			return null;
		}

		if (ret === undefined) return null;

		return ret;
	}

	this.getLBIOE(level, sched) {
		var ret;
		var schedIndex = ((typeof sched == 'number') ? sched : this.schedToIndex(sched));
		if ((level < 10) || (level > 53)) return null;
		try
		{
			ret = this.parent.tree.LBIOE[level][schedIndex];
		}
		catch(ex)
		{
			ret = null;
		}

		return ret;
	}
};