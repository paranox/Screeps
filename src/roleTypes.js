module.exports =
{
	Type: Object.freeze( { Unknown: -1, Builder: 0, Harvester: 1, Upgrader: 2, Repairer: 3, Supplier: 4, } ),
	getNameOf: function(index) { return Object.keys(this.Type)[index + 1]; }
}