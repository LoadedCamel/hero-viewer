'use strict';

const {clipboard}   = require('electron');
const {ipcRenderer} = require('electron');

const locutus       = require('../locutus_php/locutus_php.js');

module.exports = function() {
	this.index = {
		i: 0,
		n: 0,
		list: [],

		setIndex: function(i) {
			this.i = Math.max(0, Math.min(this.n, i));
		},

		getIndex: function() {
			return this.i;
		},

		count: function() {
			return this.n;
		},

		clearList: function() {
			this.i = 0;
			this.n = 0;
			this.list = [];
		},

		addListItem: function(cmd, param, label) {
			param = ((param == null) ? '' : ' ' + param);
			this.list[this.list.length] = {
				cmd: ((cmd != null) ? '/' + cmd + param : null),
				label: ((label === undefined) ? null : label),
				get: function() {
					if (this.label !== null)
					{
						return '<h2>' + this.label + '</h2>';
					}
					else
					{
						return this.cmd;
					}
				},
				isInteractible: function() {
					return (this.label === null);
				}
			};
			this.n++;
		},

		sort: function() {
			this.list = this.list.sort(function(a, b) {
				if (/^\/levelupxp/.test(a.cmd) || /^\/badgegrant/.test(a.cmd) || /^\/influence/.test(a.cmd)) return -1;
				if (/^\/levelupxp/.test(b.cmd) || /^\/badgegrant/.test(b.cmd) || /^\/influence/.test(b.cmd)) return -1;
				return locutus.php.strcmp(a.cmd, b.cmd);
			});
		},

		next: function() {
			if (this.i == this.n) return;

			var c;
			do
			{
				this.i++;
				c = this.current();
				if (c.isInteractible()) return c.get();
			} while (!c.isInteractible())
		},

		prev: function() {
			if (this.i == 0) return;

			var c;
			do
			{
				this.i--;
				c = this.current();
				if (c.isInteractible()) return c.get();
			} while (!c.isInteractible())
		},

		reset: function() {
			this.i = 0;
		},

		current: function() {
			return this.list[this.i].get();
		},

		renderHTML: function() {
			var ret = '';

			if (this.n == 0) return ret;

			ret += '<ul id="cmdlist" class="powers_list slash_cmds test_server">';
			while (this.i < this.n)
			{

				ret += '<li>';
				ret += '<span class="raw">' + this.current() + '</span>';
				ret += '<span class="selectable">' + this.current() + '</span>';
				ret += '</li>';
				this.next();
			}

			ret += '</ul>';

			return ret;
		},

		parent: null
	};

	this.index.parent = this;

	this.autoCopy = true;
	this.highlightedItem = null;

	this.isAttunedOnly = function(enhData) {
		return (enhData.TypeID == 4);
	};

	this.isATO = function(enhData) {
		if (!enhData.UIDSet) return false;

		return (
			(enhData.TypeID == 4) &&
			(!/Avalanche$/.test(enhData.UIDSet)) &&
			(!/Blistering\_Cold$/.test(enhData.UIDSet)) &&
			(!/Entomb$/.test(enhData.UIDSet)) &&
			(!/Frozen\_Blast$/.test(enhData.UIDSet)) &&
			(!/Winters\_Bite$/.test(enhData.UIDSet)) &&
			(!/Overwhelming\_Force$/.test(enhData.UIDSet))
		);
	};

	this.isMoviesSet = function(enhData) {
		if (!enhData.UIDSet) return false;

		return (enhData.UIDSet == 'Overwhelming_Force');
	};

	this.allowCatalystUpgrade = function(enhData) {
		if (!enhData.UIDSet) return false;

		return ((this.isAttunedOnly(enhData)) && (!this.isMoviesSet(enhData)));
	};

	this.isSpecialOrigin = function(enhUID) {
		return ((/^Hamidon\_/.test(enhUIDName)) || (/^Titan\_/.test(enhUIDName)) || (/^Hydra\_/.test(enhUIDName)));
	};

	this.render = function() {
		if (this.index.count() == 0) return '';

		return this.index.renderHTML();
	};

	this.generateSlashCmdList = function(charBuild) {
		this._generateSlashCmdListV2(charBuild);
	};

	// v1 use /boost commands only
	// v2 use /boostset commands or /boost when only one enhancement of a set is used
	this._generateSlashCmdListV2 = function(charBuild) {
		var i, j, e, enhUIDName, enhNIDSet, enhMaxLevel, enhData, setsCount;

		this.clearList();
		this.addListItem('levelupxp', '50'); // Max level
		this.addListItem('influence', '2000000000'); // Max inf (2 bil)
		//this.addListItem('badgegrant', 'ouroborosenabled'); // Enable ouroboros access (optional)
		//this.addListItem('badgegrant', 'MiragePatron'); // Unlock villain epic pools (not needed, auto granted on HC Beta)

		for (i=0 ; i<charBuild.powers.length ; i++)
		{
			// Power name header
			//this.addListItem(null, null, charBuild.powers[i].data.DisplayName);

			setsCount = [];
			for (j=0 ; j<charBuild.powers[i].slots ; j++)
			{
				enhData = charBuild.powers[i].slots[j].data;
				enhUIDName = enhData.UID;
				enhUIDName = enhUIDName.replace(/^(Superior\_)?Attuned\_(Superior\_)?/g, '');
				enhNIDSet = ((enhData.nIDSet > -1) ? parseInt(enhData.nIDSet) : null);
				enhMaxLevel = enhData.LevelMax + 1;
				if ((enhNIDSet !== null) && ((enhMaxLevel == 50) || this.isAttunedOnly(enhData))) // Only use /boostset on 50s sets since it can only give crafted enhancements.
				{
					if (this.allowCatalystUpgrade(enhData))
					{
						if (this.isATO(enhData))
						{
							e = enhDB.fetchSetByUID('Superior_Attuned_Superior_' + enhUIDName.replace(/\_[A-F]$/g, ''));
						}
						else
						{
							e = enhDB.fetchSetByUID('Superior_' + enhUIDName.replace(/\_[A-F]$/g, ''));;
						}

						enhNIDSet = parseInt(e.index);
						enhUIDName = 'Superior_' + enhUIDName;
					}
					else if (!this.isMoviesSet(enhData))
					{
						enhUIDName = 'Attuned_' + enhUIDName;
					}
					if (!setsCount[enhNIDSet])
					{
						setsCount[enhNIDSet] = {count: 1, enh: [{uid: enhUIDName, level: ((enhMaxLevel <= 1) ? 1 : 50)}]};
					}
					else
					{
						setsCount[enhNIDSet].count++;
						setsCount[enhNIDSet].enh[setsCount[enhNIDSet].enh.length] = {uid: enhUIDName, level: ((enhMaxLevel <= 1) ? 1 : 50)};
					}
				}
				else if (enhNIDSet !== null) // Force attuned for sub-50 sets
				{
					enhUIDName = 'Attuned_' + enhUIDName;
					this.addListItem('boost', enhUIDName + ' ' + enhUIDName + ' 1');
				}
				else if (this.isSpecialOrigin(enhUIDName)) // Hamidon, Titan, Hydra origin
				{
					this.addListItem('boost', enhUIDName + ' ' + enhUIDName + ' 53');
				}
				else
				{
					enhUIDName = 'Crafted_' + enhUIDName;
					this.addListItem('boost', enhUIDName + ' ' + enhUIDName + ' 50');
				}
			}
		}

		if (setsCount.length == 0) return;

		setsCount = setsCount.sort(function(a, b) { // sort by count, desc
			if (a.count < b.count) return 1;

			return -1;
		});

		for (i in setsCount)
		{
			if (typeof i !== 'number') return;
			if (!setsCount[i].count) return;

			if (setsCount[i].count == 1)
			{
				this.addListItem('boost', setsCount[i].enh[0].uid, setsCount[i].enh[0].uid, setsCount[i].enh[0].level);
			}
			else
			{
				this.addListItem('boostset', setsCount[i].enh[0].uid.replace(/\_[A-F]$/g, ''));
			}
		}
	};

	// Deprecated
	this._generateSlashCmdListV1 = function(charBuild) {
		var i, j, enhUIDName, enhData;

		this.clearList();
		this.addListItem('levelupxp', '50'); // Max level
		this.addListItem('influence', '2000000000'); // Max inf
		//this.addListItem('badgegrant', 'ouroborosenabled'); // Enable ouroboros access (optional)
		//this.addListItem('badgegrant', 'MiragePatron'); // Unlock villain epic pools (not needed, auto granted on HC Beta)

		for (var i=0 ; i<charBuild.powers.length ; i++)
		{
			this.addListItem(null, null, charBuild.powers[i].data.DisplayName);
			for (var j=0 ; j<charBuild.powers[i].slots ; j++)
			{
				// This may fail with SOs, HOs and ATOs. TBDL.
				// Notes for Reg IO:
				// EndRed -> Endurance_Discount
				// EndMod -> Recovery
				// Resist -> Res_Damage
				// Slow   -> Snare
				enhData    = charBuild.powers[i].slots[j].data;
				enhUIDName = enhData.UID;
				enhUIDName = enhUIDName.replace(/^(Superior\_)?Attuned\_(Superior\_)?/g, '');
				if (this.isAttunedOnly(enhData))
				{
					if (this.allowCatalystUpgrade(enhData))
					{
						/*
						if (this.isATO(enhData))
						{
							enhUIDName = 'Superior_Attuned_Superior_' + enhUIDName; // Accurate command is /boostset Superior_Defiant_Barrage 1
						}
						else
						{
							enhUIDName = 'Superior_' + enhUIDName;
						}
						*/
						enhUIDName = 'Superior_' + enhUIDName;
					}
					else if (!this.isMoviesSet(enhData))
					{
						enhUIDName = 'Attuned_' + enhUIDName;
					}

					this.addListItem('boost', enhUIDName + ' ' + enhUIDName + ' 1');
				}
				else
				{
					if (this.useAttuned)
					{
						enhUIDName = 'Attuned_' + enhUIDName;
						this.addListItem('boost', enhUIDName + ' ' + enhUIDName + ' 1');
					}
					else
					{
						enhUIDName = 'Crafted_' + enhUIDName;
						this.addListItem('boost', enhUIDName + ' ' + enhUIDName + ' ' + Math.min(50, (charBuild.powers[i].slots[j].data.LevelMax + 1)));
					}
				}
			}
		}
	};

	this.highlightListItem = function(i) {
		if ((i < 0) || (i > this.index.count())) return;

		var list = document.getElementById('cmdlist');
		if (!list) return;

		if (this.highlightedItem !== null) list.getElementsByTagName('li').item(this.highlightedItem).className = '';

		list.getElementsByTagName('li').item(i).className = 'highlight';
		this.highlightedItem = i;

		if (this.autoCopy) this.copyCmdToClipboard(list.getElementsByTagName('li').item(i).textContent.trim());
	};

	this.callbacks = {
		updateButtonStates: function() {
			if (this.index.getIndex() == 0)
			{
				document.getElementById('slistprev').className = document.getElementById('slistprev').className + ' disabled';
			}
			else
			{
				document.getElementById('slistprev').className = document.getElementById('slistprev').className.replace(' disabled', '');
			}

			if (this.index.getIndex() == this.index.count() - 1)
			{
				document.getElementById('slistnext').className = document.getElementById('slistprev').className + ' disabled';
			}
			else
			{
				document.getElementById('slistnext').className = document.getElementById('slistnext').className.replace(' disabled', '');
			}
		},

		btnPrev: function() {
			if (this.index.getIndex() == 0) return;

			this.index.setIndex(--this.index.getIndex());
			this.parent.highlightListItem(this.index.getIndex());

			this.updateButtonStates();
		},

		btnNext: function() {
			if (this.index.getIndex() == this.index.count() - 1) return;

			this.index.setIndex(++this.index.getIndex());
			this.parent.highlightListItem(this.index.getIndex());

			this.updateButtonStates();
		},

		btnClose: function() {
			ipcRenderer.send('closeTestSrvWin', null);
		},

		toggleAutoCopy: function() {
			this.autoCopy = !this.autoCopy;

			if (this.autoCopy)
			{
				document.getElementById('sautocopy').className = 'heroaction active';
			}
			else
			{
				document.getElementById('sautocopy').className = 'heroaction';
			}
		},

		parent: null
	};

	this.callbacks.parent = this;

	this.copyCmdToClipboard = function(txt) {
		clipboard.writeText(txt);
	};
};


/*
Combinations to build and send to test server:
[ pass ] Blaster Rad/Fire
[ pass ] Blaster Ice/Time
[ pass ] Blaster Ice/Plants
[ pass ] Blaster Beam rifle/Martial combat
[ fail ] Blaster Ice/Ice
[ fail ] Blaster Dark/Psy
[ fail ] Sent Beam rifle/Energy
Corruptor Rad/pain
Brute Kinetic Melee/Ice // Ice Melee/Ice
Brute Kinetic Melee/Elec
Brute Staff/Elec
Brute Street/Bio
Brute SS/Shield
Dom Dark/Dark // Dark/Psy
Dom Earth/Ice
*/