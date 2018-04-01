module.exports =
{
	Type:Object.freeze( { AtLeast:0, Weight:1, PerOtherPart:2, PerPartOfType:3 } ),
	isDefined:function(type) { return type >= 0 && type < Object.keys(this.Type).length; },
	getNameOf:function(index) { return Object.keys(this.Type)[index]; }
}