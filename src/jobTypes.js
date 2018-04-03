module.exports =
{
	Type:Type = Object.freeze( { Harvest:0, Build:1, Upgrade:2, Repair:3, Supply:4, Store:5, Resupply:6, Wait:7, Pickup:8 } ),
	isDefined:function(type) { return type >= 0 && type < Object.keys(this.Type).length; },
	getNameOf:function(index) { return Object.keys(this.Type)[index]; }
}