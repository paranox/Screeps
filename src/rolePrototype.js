function Role(roleName)
{
	//console.log("Role(" + roleName + ")");
	this.roleName = roleName;
	this.minimumParts = [WORK, CARRY, MOVE];
    this.partWeightMap = {};
};

Role.prototype.init = function(creep)
{

};

Role.prototype.run = function(creep)
{
	console.log(creep.name + ": " + this.roleName + " of type " + (typeof this) + " can't do anything!");
};

Role.prototype.clear = function(creep)
{
	
};

module.exports = Role;