module.exports =
{
	Type: Type = Object.freeze( { Unknown: -1, Harvest: 0, Build: 1, Upgrade: 2, Repair: 3, Supply: 4, Store: 5, Resupply: 6 } ),
	getNameOf: function(index) { return Object.keys(this.Type)[index + 1]; }
}