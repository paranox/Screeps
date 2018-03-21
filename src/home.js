var Utils = require('utils');
var Role = require('roleTypes');

function Home(spawn)
{
	if (spawn.memory.home == undefined)
	{
		let indexA = spawn.name.indexOf("[", 0);
		let indexB = indexA >= 0 ? spawn.name.indexOf("]", indexA) : -1;
		if (indexA >= 0)
		{
			if (indexB >= 0)
				this.name = "Home[" + spawn.name.substr(indexA + 1, indexB - indexA - 1) + "]";
			else
				this.name = "Home[" + spawn.name.substr(indexA + 1) + "]";
		}
		else
			this.name = "Home[" + spawn.name + "]";

		this.spawnID = spawn.id;
		this.spawn = spawn;

		this.spawn.memory.home = createHomeMemoryObject(this.name, spawn);

		console.log("Initialized home: " + Utils.objectToString(this, 0, 0));
	}
	else
		this.name = spawn.memory.home.name;

	this.spawnID = spawn.id;
	this.spawn = spawn;
}

Home.prototype.init = function()
{
	if (this.spawn == null)
	{
		console.log("No Spawn defined for " + this.name + "");
		return;
	}

	this.roles = this.spawn.memory.home.roles;
    if (this.roles == undefined || this.roles == null)
    {
    	this.roles = [
            createRoleMemoryObject(Role.Type.Builder,   0, 1, 6, 2.0),
            createRoleMemoryObject(Role.Type.Harvester, 0, 2, 6, 3.0),
            createRoleMemoryObject(Role.Type.Repairer,  0, 1, 4, 1.5),
            createRoleMemoryObject(Role.Type.Supplier,  0, 2, 3, 2.5),
            createRoleMemoryObject(Role.Type.Upgrader,  0, 1, 4, 1.0)
        ]

        //console.log(this.spawn.name + ": Initialized default roles: " + Utils.objectToString(this.roles));
    }
}

Home.prototype.setRoleCount = function(roleType, count)
{
	if (this.roles == undefined)
	{
		console.log("No roles defined for " + this.name + "");
		return;
	}

	if (roleType >= this.roles.length)
	{
		console.log(this.spawn.name + ": Role type index out of range: " + roleType + " > " + this.roles.length);
		return;
	}

	if (this.roles[roleType] != undefined)
		this.roles[roleType].count = count;
}

Home.prototype.end = function()
{
	if (this.spawn != null)
	{
		if (this.spawn.memory.home == undefined)
			this.spawn.memory.home = createHomeMemoryObject(this.name, this.spawn, this.roles);
		else
			this.spawn.memory.home.roles = this.roles;
	}
}

module.exports = Home.prototype;

// Internal functions

function createHomeMemoryObject(name, spawn, roles)
{
	return { "name": name, "spawn": spawn.id, "roles": roles };
}

function createRoleMemoryObject(roleType, count, min, max, priority, weight)
{
	return {
		"roleName": Role.getNameOf(roleType),
		"roleType": roleType,
		"count": count,
		"min": min,
		"max": max,
		"priority": priority
	};
}