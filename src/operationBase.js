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
			spawn:Game.getObjectById(data.home.spawnID)
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

	/*context.actors = [];
	if (data.actors != null)
	{
		var actor, dataActor;
		for (var id in data.actors)
		{
			dataActor = data.actors[id];
			actor = Game.empire.actors[id];
			if (actor != null)
			{
				if (actor.creep.memory.operationID == context.id)
				{
					if (context.doDebug)
						console.log("Operation " + context.opName + "[" + context.id + "]: found actor by the id of " + id);

					context.actors.push(actor);
				}
				else
				{
					console.log("Operation " + context.opName + "[" + context.id + "]: found actor by the id of " +
						id + " but it's enlisted in another Operation: " + actor.creep.memory.operationID);
				}
				//actor.setOperation(context); // This disallows editing Operation assignments from creep memory
			}
			else
				console.log("Operation " + context.opName + "[" + context.id + "]: unable to find actor by the id of " + id);
		}
	}

	console.log("Operation " + context.opName + "[" + context.id + "]: " + context.actors.length + " actors enlisted!");*/

	return true;
}

OperationBase.prototype.createSaveData = function(context)
{
	if (context == undefined)
		context = this;

	var memoryObject = Memory.empire.operations[context.id] != undefined ? Memory.empire.operations[context.id] : {};

	memoryObject.id = context.id;
	memoryObject.opName = context.opName;
	memoryObject.opType = context.opType;
	
	if (context.home != null)
	{
		memoryObject.home =
		{
			roomName:(context.home.room != undefined ? context.home.room.name : "undefined"),
			spawnID:(context.home.spawn != null ? context.home.spawn.id : "undefined"),
			hasCreepInSpawnQueue:context.home.hasCreepInSpawnQueue
		};
	}
	else
		console.log("Operation " + context.opName + "[" + context.id + "]: No home defined in context!");

	var roles = {};
	var roleKeys = context.roles != null ? Object.keys(context.roles) : [];
	var roleData;
	for (var i = 0; i < roleKeys.length; i++)
	{
		roleData = Operation.createRoleDataFromPosition(context.roles[roleKeys[i]]);
		roles[roleData.roleType] = roleData;
	}

	if (Object.keys(roles).length > 0)
		memoryObject.roles = roles;

	memoryObject.actors = {};
	if (context.actors != null)
	{
		var actor;
		for (var i = 0; i < context.actors.length; i++)
		{
			actor = context.actors[i];
			memoryObject.actors[actor.creep.id] = actor.creep.name;
		}
	}

	return memoryObject;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

OperationBase.prototype.update = function()
{
	if (this.home == null)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]: Has no home!");
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

	var priority;
	var highestpriority = 0.0;
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
				priority = 100;
		}
		else
		{
			if (!Array.isArray(role.priority))
				priority = role.priority;
			else if (role.current < role.priority.length)
				priority = role.priority[role.current];
			else
				priority = role.priority[role.priority.length - 1];
		}

		if (priority > highestpriority)
		{
			if (this.doDebug)
			{
				console.log("Operation " + this.opName + "[" + this.id + "]: Role " + Role.getNameOf(role.roleType) +
					" is priorityed with priority " + priority);
			}

			highestpriority = priority;
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

	this.home.hasCreepInSpawnQueue = false;
	if (this.home.spawn != null)
	{
		if (this.home.spawn.memory.spawning != null)
		{
			var spawningBlueprint = this.home.spawn.memory.spawning;
			if (spawningBlueprint.opts != null && spawningBlueprint.opts.memory != null && spawningBlueprint.opts.memory.orderedByOp == this.id)
			{
				//console.log("Operation " + this.opName + "[" + this.id + "]: Home spawn is spawning blueprint " +
				//	JSON.stringify(this.home.spawn.memory.spawning));

				this.home.hasCreepInSpawnQueue = true;
			}
		}

		if (!this.home.hasCreepInSpawnQueue)
		{
			var entry, priority;
			for (const id in this.home.spawn.memory.spawnQueue)
			{
				entry = this.home.spawn.memory.spawnQueue[id];
				if (entry.blueprint != null && entry.blueprint.opts != null && entry.blueprint.opts.memory != null)
				{
					if (entry.blueprint.opts.memory.orderedByOp == this.id)
					{
						//console.log("Operation " + this.opName + "[" + this.id + "]: Home spawn has blueprint in spawn queue: " +
						//	JSON.stringify(blueprint));

						this.home.hasCreepInSpawnQueue = true;
						break;
					}
				}
				else
					console.log("Operation " + this.opName + "[" + this.id + "]: Home spawn has an invalid blueprint in spawn queue with id " + id);
			}
		}
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

		var id = neededRole.roleName + "_" + this.id + "_" + Game.time;
		CreepFactory.addBlueprintToSpawnQueue(this.home.spawn, id, highestpriority, nextBlueprint);
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
    roles[Role.Type.Harvesters] = Operation.createRolePositionObject(Role.Type.Harvester, 0, 2, 4, 1.0);
    return roles;
}

module.exports = OperationBase.prototype;