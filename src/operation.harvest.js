var Operation = require('operationTypes');
var OperationBase = require('operationBase');
var Role = require('roleTypes');
var JobFactory = require('jobFactory');
var JobWait = require('job.wait');
var Job = require('jobTypes');

function Harvest(opts)
{
	//console.log("OperationBase->Harvest.constructor(opts: " + JSON.stringify(opts) + ")");
	this.opName = "Harvest";
	this.opType = Operation.Type.Harvest;
	
    this.base = OperationBase;
    this.base.constructor(this, opts);

	if (opts == null)
		return;
	
	if (opts.target != null)
		this.target = opts.target;
}

/// Memory functions, should always be called via context's override
/// NOTE: These require a context reference and are usually

Harvest.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data != null)
	{
		if (data.target != undefined)
			this.target = Game.getObjectById(data.target);
	}

	return true;
}

Harvest.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);
	
	if (this.target != null)
		data["target"] = this.target.id;

	return data;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

Harvest.prototype.onUpdate = function()
{
	
}

Harvest.prototype.getJob = function(actor)
{
	if (actor.creep.carry.energy >= actor.creep.carryCapacity)
	{
		//console.log("Operation " + this.opName + ": Actor full of energy!");
		return null;
	}

	if (this.target == null)
	{
		console.log("Operation " + this.opName + "[" + this.id + "]: No target specified!");
		return null;
	}

	if (this.target.energy == 0)
	{
		if (this.doDebug)
			console.log("Operation " + this.opName + "[" + this.id + "]: Target " + this.target + " at " + this.target.pos + " has no energy left!");

		// This is supposed to force a Store type job
		if (actor.creep.carry.energy > 0)
			return null;

		return JobFactory.createFromType(Job.Type.Wait,
		{
			for:actor.creep.name,
			target:this.target,
			waitType:JobWait.WaitType.EnergyLevel,
			testType:JobWait.TestType.Greater,
			testValue:0
		});
	}

	return JobFactory.createFromType(Job.Type.Harvest, { for:actor.creep.name, target:this.target } );
}

Harvest.prototype.createDefaultRoles = function()
{
	var roles = {};
	roles[Role.Type.Harvester] = Operation.createRolePositionObject(Role.Type.Harvester, 0, 1, 3, [2.5, 1.0]);
	return roles;
}

module.exports = Harvest.prototype;