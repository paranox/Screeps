var Utils = require('utils');
var JobBase = require('jobBase');
var Job = require('jobTypes');

function Claim(opts)
{
	//console.log("JobBase->Claim.constructor(opts: " + Utils.objectToString(opts, 0, 1) + ")");
	this.jobName = "Claim";
	this.jobType = Job.Type.Claim;
	
    this.base = JobBase;
    this.base.constructor(this, opts);

	if (!opts)
		return;
	
	if (opts.target != null)
		this.target = opts.target;
	
	this.doReserve = opts.doReserve;
}

Claim.prototype = Object.create(JobBase);
Claim.prototype.constructor = Claim;

Claim.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (!data.target)
	{
		console.log("No target data found!");
		return false;
	}

	this.target = Game.rooms[data.target];
	this.doReserve = data.doReserve;

	//console.log("Target found based on save data: " + data.target);
	return true;
}

Claim.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target)
		data.target = this.target.name;
	else
		console.log("No target data to save!");

	if (this.doReserve)
		data.doReserve = true;

	return data;
}

Claim.prototype.onStart = function(actor)
{
	if (this.doReserve)
		actor.creep.say("Reserve!");
	else
		actor.creep.say("Claim!");
}

Claim.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (!this.target || !this.target.controller)
    {
    	this.finish(actor, false);
    	return;
    }
    
	if (!actor.creep.pos.isNearTo(this.target.controller))
	{
    	let status = actor.creep.moveTo(this.target.controller);
    	switch (status)
    	{
    		case OK: break;
    		default:
    			console.log(actor.creep.name + ": Unable to move towards target " +
    				this.target.controller + " at " + this.target.controller.pos + ", error code: " + status);
    			break;
    	}
    }
    else if (this.doReserve)
    {
    	let status = actor.creep.reserveController(this.target.controller);
    	switch (status)
    	{
    		case OK: break;
    		case ERR_GCL_NOT_ENOUGH:
    			console.log(actor.creep.name + ": Unable to reserve target " +
    				this.target.controller + " at " + this.target.controller.pos + ",, GCL " +
    				Game.gcl.level + " not high enough! Error code: " + status);
    			this.finish(actor, false);
    			break;
    		default:
    			console.log(actor.creep.name + ": Unable to reserve target " +
    				this.target.controller + " at " + this.target.controller.pos + ",, error code: " + status);
    			break;
    	}
    }
    else
    {
    	let status = actor.creep.claimController(this.target.controller);
    	switch (status)
    	{
    		case OK: break;
    		case ERR_GCL_NOT_ENOUGH:
    			console.log(actor.creep.name + ": Unable to claim target " +
    				this.target.controller + " at " + this.target.controller.pos + ",, GCL " +
    				Game.gcl.level + " not high enough! Error code: " + status);
    			this.finish(actor, false);
    			break;
    		default:
    			console.log(actor.creep.name + ": Unable to claim target " +
    				this.target.controller + ", error code: " + status);
    			break;
    	}
    }
}

module.exports = Claim.prototype;