var Utils = require('utils');
var Operation = require('operationTypes');
var Role = require('roleTypes');
var CreepFactory = require('creepFactory');

function OperationBase(context, opts)
{
	//console.log("Operation.constructor(" + context.opName + " | " +
	//	Operation.getNameOf(context.opType) + "[" + context.opType + "])");

	context.home = {};
	context.roles = {};
	context.actors = [];

	if (opts != null)
	{
		if (opts.id != undefined)
			context.id = opts.id;
		
		if (opts.home != null)
			context.home = opts.home;

		if (opts.roles != null)
			context.roles = opts.roles;

		if (Array.isArray(opts.actors))
			context.actors = opts.actors;
	}

	if (context.readSaveData == undefined)
		context.readSaveData = this.readSaveData;
	if (context.createSaveData == undefined)
		context.createSaveData = this.createSaveData;

	//if (context.start == undefined)
	//	context.start = this.start;
	if (context.update == undefined)
		context.update = this.update;
	if (context.onUpdate == undefined)
		context.onUpdate = this.onUpdate;
	if (context.end == undefined)
		context.end = this.end;
	if (context.onEnd == undefined)
		context.onEnd = this.onEnd;

	if (context.getJob == undefined)
		context.getJob = this.getJob;
	if (context.addActor == undefined)
		context.addActor = this.addActor;
	if (context.setRoleActorCount == undefined)
		context.setRoleActorCount = this.setRoleActorCount;
	if (context.modifyRoleActorCount == undefined)
		context.modifyRoleActorCount = this.modifyRoleActorCount;
	if (context.createDefaultRoles == undefined)
		context.createDefaultRoles = this.createDefaultRoles;
}

/// Memory functions, should always be called via context's override
/// NOTE: These require a context reference and are usually

OperationBase.prototype.readSaveData = function(context, data)
{
	context.doDebug = data.doDebug == true;
	context.opName = (data.opName != undefined && data.opName != null ? data.opName : "Unnamed");
	context.opType = (data.opType != undefined && data.opType != null ? data.opType : -1);
	context.id = (data.id != undefined && data.id != null ? data.id : Game.empire.consumeNewOperationID());

	if (data.home != null)
	{
		context.home =
		{
			room:Game.rooms[data.home.roomName],
			spawn:Game.getObjectById(data.home.spawnID),
			hasCreepInSpawnQueue:(data.home.hasCreepInSpawnQueue == true)
		};
	}

	var roleKeys = data.roles != null ? Object.keys(data.roles) : [];
	var rolePosition;
	if (data.roles != null && roleKeys.length > 0)
	{
		for (var i = 0; i < roleKeys.length; i++)
		{
			rolePosition = Operation.createRolePositionFromData(data.roles[roleKeys[i]]);
			context.roles[rolePosition.roleType] = rolePosition;
		}
	}
	else
	{
		console.log("Operation " + context.opName + "[" + context.id + "]: No roles object was defined in save data!");
		context.roles = context.createDefaultRoles();
	}

	if (data.actors != null && data.actors.length > 0)
	{
		var actor;
		for (var i = 0; i < data.actors.length; i++)
		{
			actor = Game.empire.actors[data.actors[i]];
			if (actor != null)
			{
				if (context.doDebug)
					console.log("Operation " + context.opName + "[" + context.id + "]: found actor[" + i + "] by the id of " + data.actors[i]);

				context.actors.push(actor);
				actor.setOperation(context);
			}
			else
				console.log("Operation " + context.opName + "[" + context.id + "]: unable to find actor[" + i + "] by the id of " + data.actors[i]);
		}
	}

	return true;
}

OperationBase.prototype.createSaveData = function(context)
{
	if (context == undefined)
		context = this;

	var memoryObject = { id:context.id, opName:context.opName, opType:context.opType };

	memoryObject["home"] =
	{
		roomName:context.home.room.name,
		spawnID:context.home.spawn.id,
		hasCreepInSpawnQueue:context.home.hasCreepInSpawnQueue
	};
	
	var roles = {};
	var roleKeys = context.roles != null ? Object.keys(context.roles) : [];
	var roleData;
	for (var i = 0; i < roleKeys.length; i++)
	{
		roleData = Operation.createRoleDataFromPosition(context.roles[roleKeys[i]]);
		roles[roleData.roleType] = roleData;
	}

	if (Object.keys(roles).length > 0)
		memoryObject["roles"] = roles;

	if (Array.isArray(context.actors))
	{
		var ids = [];
		var actor;
		for (var i = 0; i < context.actors.length; i++)
		{
			actor = context.actors[i];
			ids.push(actor.creep.id);
		}

		if (ids.length > 0)
			memoryObject["actors"] = ids;
	}

	return memoryObject;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

OperationBase.prototype.update = function()
{
	if (this.home == null)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]:has no home!");
		return;
	}

	var role;
	var roleKeys = this.roles != null ? Object.keys(this.roles) : [];
	for (var i = 0; i < roleKeys.length; i++)
	{
		role = this.roles[roleKeys[i]];
		this.setRoleActorCount(role.roleType, 0);
	}

	if (Array.isArray(this.actors))
	{
		var i;
		var actor;
		for (i = 0; i < this.actors.length; i++)
		{
			actor = this.actors[i];
			this.modifyRoleActorCount(actor.roleType, 1);
		}
	}

	var need;
	var highestNeed = 0.0;
	var neededRole = null;

	for (i = 0; i < roleKeys.length; i++)
	{
		role = this.roles[roleKeys[i]];

		if (role.max != undefined && role.current >= role.max)
		{
			if (this.doDebug)
			{
				console.log("Operation " + this.opName + "[" + this.id + "]: Role " + Role.getNameOf(role.roleType) +
					" satisfied with " + role.current + " actors...");
			}

			continue;
		}

		if (role.priority == undefined)
		{
			if (role.current < role.min)
				need = 100;
		}
		else
		{
			if (!Array.isArray(role.priority))
				need = role.priority;
			else if (role.current < role.priority.length)
				need = role.priority[role.current];
			else
				need = role.priority[role.priority.length - 1];
		}

		if (need > highestNeed)
		{
			highestNeed = need;
			neededRole = role;
		}
	}

	if (neededRole != null)
	{
		if (this.doDebug)
			console.log("Operation " + this.opName + "[" + this.id + "]: Needs role " + JSON.stringify(neededRole));

		if (neededRole.roleType != undefined)
		{
        	//if (this.doDebug)
			//	console.log("Global actors (in op obj) before role enlistment:\n" + Utils.objectToString(Game.empire.actors, 0, 0));

			var creep, actor;
			for (var id in Game.empire.actors)
			{
				//if (this.doDebug)
				//	console.log("Operation " + this.opName + "[" + this.id + "]:Finding actor by the id of " + id);

				actor = Game.empire.actors[id];

				if (actor == undefined || actor == null)
				{
					console.log("Operation " + this.opName + "[" + this.id + "]: Actor by the id of " + id + " no longer exists!");
					continue;
				}

				if (actor.creep.spawning || actor.operation != null)
					continue;

				if (actor.roleType == neededRole.roleType)
				{
					console.log("Operation " + this.opName + "[" + this.id + "]:Enlisting " + actor.creep.name + ", id[" + id + "]");
					actor.setOperation(this);
					this.addActor(actor);
					neededRole = null;
					break;
				}
			}
		}
		else
			console.log("Operation " + this.opName + "[" + this.id + "]: Needed role has no roleType property: " + JSON.stringify(neededRole));
	}

	if (neededRole != null && !this.home.hasCreepInSpawnQueue && this.home.spawn != null)
	{
		this.home.hasCreepInSpawnQueue = true;

		var nextBlueprint = CreepFactory.buildBlueprintByRole(Role.Type[neededRole.roleName],
			this.home.room.energyCapacityAvailable, 50);

		if (nextBlueprint.opts.memory != null)
			nextBlueprint.opts.memory.orderedByOp = this.id;
		else
			nextBlueprint.opts.memory = { orderedByOp: this.id };

		CreepFactory.addBlueprintToSpawnQueue(this.home.spawn, nextBlueprint);
	}

	this.onUpdate();
}

OperationBase.prototype.onUpdate = function()
{
	// Should be overridden to provide functionality
}

OperationBase.prototype.end = function()
{
	this.onEnd();
}

OperationBase.prototype.onEnd = function()
{
	// Should be overridden to provide functionality
}

OperationBase.prototype.getJob = function(actor)
{
	// Should be overridden to provide functionality
	return null;
}

OperationBase.prototype.addActor = function(actor)
{
	if (this.doDebug)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]: Adding actor " + actor.creep.name +
			" by id of " + actor.creep.id);
	}

	if (actor.creep.memory.orderedByOp != undefined)
	{
		if (actor.creep.memory.orderedByOp == this.id)
		{
			if (!this.home.hasCreepInSpawnQueue)
			{
				console.log("Operation " + this.opName + "[" + this.id + "]: Actor " + actor.creep.name +
					" was marked as order by this operation but it was unexpected.");
			}
			else if (this.doDebug)
				console.log("Operation " + this.opName + "[" + this.id + "]: Received an ordered actor " + actor.creep.name);

			this.home.hasCreepInSpawnQueue = false;
		}
		else
		{
			console.log("Operation " + this.opName + "[" + this.id + "]: Actor " + actor.creep.name +
				" was marked as order by another operation " + actor.creep.memory.orderedByOp +
				"! Canceled adding to this operation!");

			return;
		}
	}

	this.actors.push(actor);
}

OperationBase.prototype.setRoleActorCount = function(roleType, count)
{
	if (this.roles == undefined)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]: Unable to set count of actors for Role." + Role.getNameOf(roleType) +
			", roles object is undefined!");

		return;
	}

	if (this.roles[roleType] == undefined)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]: Unable to set count of actors for Role." + Role.getNameOf(roleType) +
			", the role was not defined in this operation!");

		return;
	}

	this.roles[roleType].current = count;

	if (this.doDebug)
	{			
		console.log("Operation " + this.opName + "[" + this.id + "]: Role " + Role.getNameOf(roleType) +
			" actor count set to " + this.roles[roleType].current);
	}
}

OperationBase.prototype.modifyRoleActorCount = function(roleType, amount)
{
	if (this.roles == undefined)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]: Unable to modify count of actors for Role." + Role.getNameOf(roleType) +
			", roles object is undefined!");

		return;
	}

	if (this.roles[roleType] == undefined)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]: Unable to modify count of actors for Role." + Role.getNameOf(roleType) +
			", the role was not defined in this operation!");

		return;
	}

	this.roles[roleType].current += amount;

	if (this.doDebug)
	{		
		console.log("Operation " + this.opName + "[" + this.id + "]: Role " + Role.getNameOf(roleType) +
			" actor count modified by " + amount + ", is now " + this.roles[roleType].current);
	}
}

OperationBase.prototype.createDefaultRoles = function()
{
	var roles = {};
    roles[Role.Type.Builder]    = Operation.createRolePositionObject(Role.Type.Builder,   0, 1, 4, [3.5, 2.8, 1.0]);
    roles[Role.Type.Harvesters] = Operation.createRolePositionObject(Role.Type.Harvester, 0, 2, 6, [5.0, 4.5, 2.5]);
    roles[Role.Type.Repairer]   = Operation.createRolePositionObject(Role.Type.Repairer,  0, 1, 4, [1.7, 1.6, 1.5]);
    roles[Role.Type.Supplier]   = Operation.createRolePositionObject(Role.Type.Supplier,  0, 2, 3, [4.0, 3.0, 1.5]);
    roles[Role.Type.Upgrader]   = Operation.createRolePositionObject(Role.Type.Upgrader,  0, 1, 2, [1.8, 1.0]);
    return roles;
}

module.exports = OperationBase.prototype;