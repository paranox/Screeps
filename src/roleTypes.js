module.exports =
{
	Type: Object.freeze( { Builder:0, Harvester:1, Upgrader:2, Repairer:3, Supplier:4, Claimer:5 } ),
	isDefined: function(type) { return type >= 0 && type < Object.keys(this.Type).length; },
	getNameOf: function(index) { return Object.keys(this.Type)[index]; }
}