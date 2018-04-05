var Operation = require('operationTypes');
var OperationBase = require('operationBase');
var Role = require('roleTypes');
var Job = require('jobTypes');

function Haul(opts)
{
	//console.log("OperationBase->Haul.constructor(opts: " + JSON.stringify(opts) + ")");
	this.opType = Operation.Type.Haul;
	this.opName = Operation.getNameOf(this.opType);
	
    this.base = OperationBase;
    this.base.constructor(this, opts);

    this.sources = {};
    this.targets = {};

	if (!opts)
		return;
	
	if (opts.sources)
	{
		if (Array.isArray(opts.sources))
		{
			var entry;
			for (var i = 0; i < opts.sources.length; i++)
			{
				entry = opts.sources[i];
				if (typeof entry == "string")
					this.sources[entry] = Game.getObjectById(entry);
				else
					this.sources[entry.id] = entry;
			}
		}
		else
			this.sources[opts.sources.id] = opts.sources;
	}

	if (opts.targets)
	{
		if (Array.isArray(opts.targets))
		{
			var entry;
			for (var i = 0; i < opts.targets.length; i++)
			{
				entry = opts.targets[i];
				if (typeof entry == "string")
					this.targets[entry] = Game.getObjectById(entry);
				else
					this.targets[entry.id] = entry;
			}
		}
		else
			this.targets[opts.targets.id] = opts.targets;
	}
}

/// Memory functions, should always be called via context's override
/// NOTE: These require a context reference and are usually

Haul.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (!data)
		return true;

	if (Array.isArray(data.sources))
	{
		for (var i = 0; i < data.sources.length; i++)
			this.sources[data.sources[i]] = Game.getObjectById(data.sources[i]);
	}
	else if (typeof data.sources == "string")
		this.sources[data.sources] = Game.getObjectById(data.sources);

	if (Array.isArray(data.targets))
	{
		for (var i = 0; i < data.targets.length; i++)
			this.targets[data.targets[i]] = Game.getObjectById(data.targets[i]);
	}
	else if (typeof data.targets == "string")
		this.targets[data.targets] = Game.getObjectById(data.targets);

	return true;
}

Haul.prototype.writeSaveData = function()
{
	var data = this.base.writeSaveData(this);
	
	if (this.sources != null)
		data.sources = Object.keys(this.sources);
	if (this.targets != null)
		data.targets = Object.keys(this.targets);

	return data;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

Haul.prototype.getConstructorOptsHelpString = function()
{
    return OperationBase.getConstructorOptsHelpString() + ", sources:(RoomObject|string_id | [ RoomObject|string_id ])," +
    	" targets:(RoomObject|string_id | [ RoomObject|string_id ])";
}

Haul.prototype.onUpdate = function()
{
	
}

Haul.prototype.getJob = function(actor)
{
	if (actor.creep.carry.energy == 0)
	{
		var chosenSource = null;
		var highestPriority = 0;

		var source, priority;
		for (var id in this.sources)
		{
			source = this.sources[id];

			if (!source)
				continue;

			if (source.energy && source.energy > 0)
				priority = source.energy / source.energyCapacity;
			else if (source.store && source.store[RESOURCE_ENERGY] > 0)
				priority = source.store[RESOURCE_ENERGY] / source.storeCapacity;

			if (actor.creep.room.name == source.room.name)
				priority /= Math.max(1, actor.creep.pos.getRangeTo(source)) / 50;

			if (priority > highestPriority)
			{
				highestPriority = priority;
				chosenSource = source;
			}
		}

		if (!chosenSource)
		{
			console.log("Operation " + this.opName + ": " + actor.creep.name + ": No source found!");
			return null;
		}

		//console.log("Operation " + this.opName + ": Giving resupply job to " + actor.creep.name + ", target: " + chosenSource);
		return Game.empire.factories.job.createFromType(Job.Type.Resupply, { for:actor.creep.name, target:chosenSource } );
	}

	if (this.targets == null || Object.keys(this.targets).length == 0)
	{
		//console.log("Operation " + this.opName + "[" + this.id + "]: No targets specified!");
		return null;
	}

	//console.log("Operation " + this.opName + "[" + this.id + "]: Giving Supply job to " + actor.creep.name + ", targets: " + Object.keys(this.targets));
	return Game.empire.factories.job.createFromType(Job.Type.Supply, { for:actor.creep.name, targets:this.targets } );
}

Haul.prototype.createDefaultRoles = function()
{
	var roles = {};
	roles[Role.Type.Supplier] = Operation.createRolePositionObject(Role.Type.Supplier, 0, 1, 3, [2.0, 1.0]);
	return roles;
}

module.exports = Haul.prototype;