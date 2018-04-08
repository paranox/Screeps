var Utils = require('utils');
var Operation = require('operationTypes');
var Role = require('roleTypes');

function OperationBase(context, opts)
{
	//console.log("Operation.constructor(" + context.opName + " | " +
	//	Operation.getNameOf(context.opType) + "[" + context.opType + "])");

	context.home = { spawnOrdersPlaced:{} };
	context.roles = {};
	context.actors = [];
    context.jobs = [];

	if (opts != null)
	{
		if (opts.id != undefined)
			context.id = opts.id;
		
		if (opts.home != null)
		{
			if (opts.home.room)
			{
				if (opts.home.room instanceof Room)
					context.home.room = opts.home.room;
				else if (typeof opts.home.room == "string")
					context.home.room = Game.rooms[opts.home.room];
				else
				{
					console.log("Operation " + context.id + " of type " + context.opType + " has an invalid home room definition: " +
						opts.home.room + " of type " + typeof opts.home.room);
				}
			}
			else
				console.log("Operation " + context.id + " of type " + context.opType + " has no home room defined in opts!");

			if (opts.home.spawn)
			{
				if (opts.home.spawn instanceof StructureSpawn)
					context.home.spawn = opts.home.spawn;
				else if (typeof opts.home.spawn == "string")
					context.home.spawn = Game.getObjectById(opts.home.spawn);
				else
				{
					console.log("Operation " + context.id + " of type " + context.opType + " has an invalid home spawn definition: " +
						opts.home.spawn + " of type " + typeof opts.home.spawn);

					if (context.home.room)
					{
						var spawn;
						for (const id in Game.spawns)
						{
							spawn = Game.spawns[id];
							if (spawn.room == context.home.room)
							{
								console.log("Operation " + context.id + " of type " + context.opType +
									" found StructureSpawn in room " + context.home.room);

								context.home.spawn = spawn;
								break;
							}
						}
					}
				}
			}
		}
		else
			console.log("Operation " + context.id + " of type " + context.opType + " has no home defined in opts!");

		if (opts.roles != null)
			context.roles = opts.roles;

		if (Array.isArray(opts.actors))
			context.actors = opts.actors;
	}

	if (context.readSaveData == undefined)
		context.readSaveData = this.readSaveData;
	if (context.createSaveData == undefined)
		context.createSaveData = this.createSaveData;

	if (context.getConstructorOptsHelpString == undefined)
		context.getConstructorOptsHelpString = this.getConstructorOptsHelpString;

	if (context.start == undefined)
		context.start = this.start;
	if (context.onStart == undefined)
		context.onStart = this.onStart;
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
	context.id = data.id != undefined && data.id != null ? data.id : Game.empire.consumeNewOperationID();

	context.opName = data.opName;
	context.opType = data.opType && Operation.Type.hasOwnProperty(data.opType) ? Operation.Type[data.opType] : -1;

	if (data.isHalted == true)
		context.isHalted = true;

	if (Array.isArray(data.jobs))
	{
		var job;
		for (var i = 0; i < data.jobs.length; i++)
		{
			job = Game.empire.factories.job.createFromData(data.jobs[i]);
			if (job != null)
				context.jobs.push(job);
		}
	}

	if (data.home)
	{
		context.home =
		{
			room:Game.rooms[data.home.roomName],
			spawn:Game.getObjectById(data.home.spawnID)
		};

		if (data.home.supportSpawnID)
			context.home.supportSpawn = Game.getObjectById(data.home.supportSpawnID);
	}

	if (data.home.spawnOrdersPlaced != null)
		context.home.spawnOrdersPlaced = data.home.spawnOrdersPlaced;

	if (data.roles)
	{
		var rolePosition;
		for (const id in data.roles)
		{
			rolePosition = Operation.createRolePositionFromData(data.roles[id]);
			context.roles[rolePosition.roleType] = rolePosition;
		}
	}
	else
	{
		context.roles = context.createDefaultRoles();

		console.log("Operation " + context.opName + "[" + context.id +
			"]: No roles object was defined in save data! Defaults created:\n" + JSON.stringify(context.roles));
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

OperationBase.prototype.writeSaveData = function(context)
{
	if (context == undefined)
		context = this;

	var memoryObject = Memory.empire.operations[context.id];

	if (!memoryObject)
	{
		memoryObject = {};
		Memory.empire.operations[context.id] = memoryObject;

		memoryObject.id = context.id;
		memoryObject.opName = context.opName;
		memoryObject.opType = Operation.getNameOf(context.opType);
	}

	if (context.isHalted == true)
		memoryObject.isHalted = true;

	// Jobs are constantly changing, don't bother checking for existing ones
    if (context.jobs.length > 0)
    {
        memoryObject.jobs = [];
        for (var i = 0; i < context.jobs.length; i++)
            memoryObject.jobs.push(context.jobs[i].createSaveData());
    }
	
	if (context.home)
	{
		if (!memoryObject.home)
		{
			memoryObject.home =
			{
				roomName:(context.home.room != undefined ? context.home.room.name : "undefined"),
				spawnID:(context.home.spawn != null ? context.home.spawn.id : "undefined"),
				spawnOrdersPlaced:context.home.spawnOrdersPlaced
			};
		}
		else
		{
			memoryObject.home.spawnOrdersPlaced = context.home.spawnOrdersPlaced;
		}
	}
	else
		console.log("Operation " + context.opName + "[" + context.id + "]: No home defined in context!");

	if (context.roles && Object.keys(context.roles).length > 0)
	{
		var role, roleData;

		if (Array.isArray(memoryObject.roles))
		{
			var rolesData = {};

			for (var i = 0; i < memoryObject.roles.length; i++)
			{
				roleData = Object.create(memoryObject.roles[i]); 
				rolesData[roleData.roleName] = roleData;
				delete memoryObject.roles[i];
			}

			memoryObject.roles = rolesData;
		}

		if (!memoryObject.roles)
			memoryObject.roles = {};

		for (const id in context.roles)
		{
			role = context.roles[id];
			roleData = memoryObject.roles[role.roleName];

			if (!roleData)
			{
				roleData = Operation.createRoleDataFromPosition(role);
				memoryObject.roles[role.roleName] = roleData;
			}
			else
				roleData.current = role.current;
		}

	}

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

OperationBase.prototype.getConstructorOptsHelpString = function()
{
	return "id:string, home:{ room:string_roomName | Room) }, roles{}, actors[ string_id ]";
}

OperationBase.prototype.start = function()
{
	var role;
	for (const type in this.roles)
	{
		role = this.roles[type];
		this.setRoleActorCount(role.roleType, 0);
	}

	if (Array.isArray(this.actors))
	{
		var i;
		var actor;
		for (i = 0; i < this.actors.length; i++)
		{
			actor = this.actors[i];
			if (actor.creep.spawning)
				this.modifyRoleActorCount(Role.Type[actor.creep.memory.role], 1);
			else
				this.modifyRoleActorCount(actor.roleType, 1);
		}
	}

	this.onStart();
}

OperationBase.prototype.onStart = function()
{
	// Should be overridden to provide functionality
}

OperationBase.prototype.update = function()
{
	if (this.home == null)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]: Has no home!");
		return;
	}

	if (this.isHalted)
		return;

	this.onUpdate();
}

OperationBase.prototype.onUpdate = function()
{
	// Should be overridden to provide functionality
}

OperationBase.prototype.end = function()
{
	if (!this.home.spawnOrdersPlaced)
		this.home.spawnOrdersPlaced = {};

	var priority;
	for (const type in this.roles)
	{
		role = this.roles[type];

		if (role.max != undefined && role.current >= role.max)
		{
			if (this.doDebug)
			{
				console.log("Operation " + this.opName + "[" + this.id + "]: Role " + Role.getNameOf(role.roleType) +
					" satisfied with " + role.current + " actors...");
			}

			continue;
		}

		if (role.roleType == undefined)
		{
			console.log("Operation " + this.opName + "[" + this.id + "]: Needed role has no roleType property: " +
				JSON.stringify(role));

			continue;
		}

		if (this.doDebug)
		{
			console.log("Operation " + this.opName + "[" + this.id + "]: Needs role " + Role.getNameOf(role.roleType) +
				", current count: " + role.current + "\n" + JSON.stringify(role));
		}

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

			if (actor.roleType == role.roleType)
			{
				console.log("Operation " + this.opName + "[" + this.id + "]:Enlisting " + actor.creep.name + ", id[" + id + "]");
				actor.setOperation(this);
				this.addActor(actor);
				role = null;
				break;
			}
		}

		if (role == null)
			continue;

		if (!Array.isArray(role.priority))
			priority = role.priority;
		else if (role.current < role.priority.length)
			priority = role.priority[role.current];
		else
			priority = role.priority[role.priority.length - 1];

		if (this.home.spawn != null)
		{
			var chosenSpawn = null;
			var orderID = role.roleName + "_" + this.id;

			// Check if order has been placed
			if (this.home.spawnOrdersPlaced[orderID])
			{
				var placedorder = this.home.spawnOrdersPlaced[orderID];
				if (placedorder.spawn)
					chosenSpawn = Game.getObjectById(placedorder.spawn);
				if (!chosenSpawn)
					chosenSpawn = this.home.spawn;
			}
			else
				chosenSpawn = this.home.spawn;

			// Check whether the order exists
			if (chosenSpawn.memory.spawnQueue && chosenSpawn.memory.spawnQueue[orderID])
			{
				if (!chosenSpawn.memory.spawnQueue[orderID].priority ||
					chosenSpawn.memory.spawnQueue[orderID].priority < priority)
				{
					console.log("Operation " + this.opName + "[" + this.id + "]: Updating priority of spawn order " + orderID +
						" from " + chosenSpawn.memory.spawnQueue[orderID].priority + " to " + priority);

					chosenSpawn.memory.spawnQueue[orderID].priority = priority;
				}

				continue;
			}

			chosenSpawn = this.home.spawn;

			var nextBlueprint = Game.empire.factories.creep.buildBlueprintFromRole(Role.Type[role.roleName]);

			if (nextBlueprint.opts.memory != null)
			{
				nextBlueprint.opts.memory.spawnOrderID = orderID;
				nextBlueprint.opts.memory.operationID = this.id;
			}
			else
				nextBlueprint.opts.memory = { spawnOrderID:orderID, operationID:this.id };

			console.log("Operation " + this.opName + "[" + this.id + "]: Adding spawn order for role " + role.roleName + "\n" +
				JSON.stringify(role));

			var maxCost = 300;

			if (role.maxCost)
				maxCost = role.maxCost;
			else if (this.home.spawn && this.home.spawn.room.energyCapacityAvailable > maxCost)
				maxCost = this.home.spawn.room.energyCapacityAvailable;

			var minCost = role.minCost ? role.minCost : maxCost * 0.75;

			if (nextBlueprint.minimumParts)
			{
				var cost = Utils.getBodyCost(nextBlueprint.minimumParts);
				if (cost > minCost)
					minCost = cost;
			}

			if (this.home.spawn && this.home.spawn.room.energyCapacityAvailable && this.home.spawn.room.energyCapacityAvailable < minCost &&
				this.home.supportSpawn && this.home.supportSpawn.room.energyCapacityAvailable >= minCost)
			{
				chosenSpawn = this.home.supportSpawn;

				if (this.home.supportSpawn && this.home.supportSpawn.room.energyCapacityAvailable > maxCost && !role.maxCost)
				{
					maxCost = this.home.supportSpawn.room.energyCapacityAvailable;
					if (!role.minCost)
						minCost = maxCost * 0.75;
				}
			}

			this.home.spawnOrdersPlaced[orderID] = { time:Game.time, role:role.roleName, priority:priority, spawn:chosenSpawn.id };
			Game.empire.factories.creep.addOrderToSpawnQueue(chosenSpawn, orderID, priority, nextBlueprint,
				minCost, maxCost);
		}
	}

	if (this.home.spawn != null)
	{
		if (this.home.spawn.memory.spawning != null)
		{
			var spawningBlueprint = this.home.spawn.memory.spawning;
			if (spawningBlueprint.opts != null && spawningBlueprint.opts.memory != null &&
				spawningBlueprint.opts.memory.operationID == this.id)
			{
				if (this.doDebug)
				{
					console.log("Operation " + this.opName + "[" + this.id + "]: Home spawn is spawning blueprint " +
						JSON.stringify(this.home.spawn.memory.spawning));
				}
			}
		}
		else if (this.home.spawn.memory.spawnQueue != null)
		{
			var spawnOrder, spawn;
			for (const id in this.home.spawnOrdersPlaced)
			{
				spawnOrder = this.home.spawnOrdersPlaced[id];

				if (!spawnOrder)
					continue;

				if (spawnOrder.spawn)
					spawn = Game.getObjectById(spawnOrder.spawn);
				else
					spawn = this.home.spawn;

				if (!spawn.memory.spawnQueue[id])
				{
					console.log("Operation " + this.opName + "[" + this.id + "]: Spawn order " + id + " wasn't found in queue of " +
						spawn + " at " + spawn.pos + "!");

					delete this.home.spawnOrdersPlaced[id];
				}
			}
		}
	}

	if (this.isHalted)
		return;

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

	if (actor.creep.memory.spawnOrderID != undefined)
	{
		if (!this.home.spawnOrdersPlaced)
		{
			if (true)//this.doDebug)
				console.log("Operation " + this.opName + "[" + this.id + "]: Initializing spawn orders (addActor)");

			this.home.spawnOrdersPlaced = {};
		}

		var spawnOrderID = actor.creep.memory.spawnOrderID;
		if (!this.home.spawnOrdersPlaced[spawnOrderID])
		{
			console.log("Operation " + this.opName + "[" + this.id + "]: Actor " + actor.creep.name +
				" was marked as ordered for this operation but it was unexpected.");
		}
		else
		{
			if (true)//this.doDebug)
			{
				var roleType = -1;
				if (actor.creep.spawning)
					roleType = Role.Type[actor.creep.memory.role];
				else
					roleType = actor.roleType;
				
				console.log("Operation " + this.opName + "[" + this.id + "]: Received an ordered actor " + actor.creep.name +
					". Actor count in role was " + (this.roles.hasOwnProperty(roleType) ? this.roles[roleType].current : "undefined"));
			}

			delete this.home.spawnOrdersPlaced[spawnOrderID];
		}
		//else
		//{
		//	console.log("Operation " + this.opName + "[" + this.id + "]: Actor " + actor.creep.name +
		//		" was marked as order by another operation " + actor.creep.memory.orderedByOp +
		//		"! Canceled adding to this operation!");
		//	
		//	return;
		//}

		delete actor.creep.memory.spawnOrderID;
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