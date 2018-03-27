var Operation = require('operationTypes');
var OperationBase = require('operationBase');
var Role = require('roleTypes');
var JobFactory = require('jobFactory');
var Job = require('jobTypes');

function Haul(opts)
{
	//console.log("OperationBase->Haul.constructor(opts: " + JSON.stringify(opts) + ")");
	this.opName = "Haul";
	this.opType = Operation.Type.Haul;
	
    this.base = OperationBase;
    this.base.constructor(this, opts);

    this.targets = {};

	if (!opts)
		return;
	
	if (opts.source != null)
		this.source = opts.source;
	if (opts.targets != undefined)
	{
		if (Array.isArray(opts.targets))
		{
			for (var id in opts.targets)
				this.targets[id] = opts.targets[id];
		}
		else
			this.targets = opts.targets;
	}
	if (opts.target != null)
		this.targets[opts.target.id] = opts.target;
}

/// Memory functions, should always be called via context's override
/// NOTE: These require a context reference and are usually

Haul.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data != null)
	{
		if (data.source != undefined)
			this.source = Game.getObjectById(data.source);
		if (Array.isArray(data.targets))
		{
			for (var i = 0; i < data.targets.length; i++)
				this.targets[data.targets[i]] = Game.getObjectById(data.targets[i]);
		}
		if (data.target != undefined)
			this.targets[data.target] = Game.getObjectById(data.target);
	}

	return true;
}

Haul.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);
	
	if (this.source != null)
		data["source"] = this.source.id;
	if (this.targets != null)
		data["targets"] = Object.keys(this.targets);

	return data;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

Haul.prototype.onUpdate = function()
{
	
}

Haul.prototype.getJob = function(actor)
{
	if (actor.creep.carry.energy == 0)
	{
		if (this.source == null)
		{
			console.log("Operation " + this.opName + ": No source specified!");
			return null;
		}

		//if (this.target.energy == 0)
		//{
		//	if (this.doDebug)
		//		console.log("Operation " + this.opName + ": Target " + this.target + " at " + this.target.pos + " has no energy left!");
		//
		//	return null;
		//}

		//console.log("Operation " + this.opName + ": Giving resupply job to " + actor.creep.name + ", target: " + this.source);
		return JobFactory.createFromType(Job.Type.Resupply, { for:actor.creep.name, target:this.source } );
	}

	if (this.targets == null)
	{
		console.log("Operation " + this.opName + ": No targets specified!");
		return null;
	}

	//console.log("Operation " + this.opName + ": Giving Supply job to " + actor.creep.name + ", target: " + this.target);
	return JobFactory.createFromType(Job.Type.Supply, { for:actor.creep.name, targets:this.targets } );
}

Haul.prototype.createDefaultRoles = function()
{
	var roles = {};
	roles[Role.Type.Supplier] = Operation.createRolePositionObject(Role.Type.Supplier, 0, 1, 3, 1.0);
	return roles;
}

module.exports = Haul.prototype;