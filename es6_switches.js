var at = 'Arachnos Soldier';
var specType = 'Secondary';
var specTypeTranslation, specIdentifier;

// ES6 variant
specTypeTranslation = ((at) => {
	return ({
		'Blaster':          {primary: 'Blaster_Ranged',         secondary: 'Blaster_Support'},
		'Brute':            {primary: 'Brute_Melee',            secondary: 'Brute_Defense'},
		'Controller':       {primary: 'Controller_Control',     secondary: 'Controller_Buff'},
		'Corruptor':        {primary: 'Corruptor_Ranged',       secondary: 'Corruptor_Buff'},
		'Defender':         {primary: 'Defender_Buff',          secondary: 'Defender_Ranged'},
		'Dominator':        {primary: 'Dominator_Control',      secondary: 'Dominator_Assault'},
		'Mastermind':       {primary: 'Mastermind_Summon',      secondary: 'Mastermind_Buff'},
		'Peacebringer':     {primary: 'Peacebringer_Offensive', secondary: 'Peacebringer_Defensive'},
		'Scrapper':         {primary: 'Scrapper_Melee',         secondary: 'Scrapper_Defense'},
		'Sentinel':         {primary: 'Sentinel_Ranged',        secondary: 'Sentinel_Defense'},
		'Stalker':          {primary: 'Stalker_Melee',          secondary: 'Stalker_Defense'},
		'Tanker':           {primary: 'Tanker_Defense',         secondary: 'Tanker_Melee'},
		'Warshade':         {primary: 'Warshade_Offensive',     secondary: 'Warshade_Defensive'},
		'Arachnos Soldier': {primary: 'Arachnos_Soldiers',      secondary: 'Training_Gadgets'},
		'Arachnos Widow':   {primary: 'Widow Training',         secondary: 'Teamwork'}
	}[at] || null);
})(at);

console.log(specTypeTranslation);

specIdentifier = ((specs, specType) => {
	return ({
		'primary':   specs.primary,
		'secondary': specs.secondary
	}[specType.toLowerCase()] || null);
})(specTypeTranslation, specType);

console.log(specIdentifier);

// Original code
/*switch (at)
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
*/