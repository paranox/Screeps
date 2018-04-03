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

	this.targetName = data.target;
	this.target = Game.rooms[data.target];

	if (data.reachedTarget)
		this.reachedTarget = data.reachedTarget;

	//console.log("Target found based on save data: " + data.target);
	return true;
}

Claim.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target)
		data.target = this.target.name;
	else if (this.targetName)
		data.target = this.targetName;
	else
		console.log("No target data to save!");

	if (this.reachedTarget)
		data.reachedTarget = this.reachedTarget;

	return data;
}

Claim.prototype.onStart = function(actor)
{
	actor.creep.say("Claim!");
}

Claim.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (this.target && actor.creep.room == this.target)
    {
    	if (!this.reachedTarget)
    	{
    		this.reachedTarget = true;

	    	if (actor.doDebug)
				console.log(actor.creep.name + ": Reached target room " + this.target);
    	}

    	if (!actor.creep.pos.isNearTo(this.target.controller))
    	{
	    	let status = actor.creep.moveTo(this.target.controller);
	    	switch (status)
	    	{
	    		case OK: break;
	    		default:
	    			console.log(actor.creep.name + ": Unable to move towards controller at " +
	    				this.target.controller + ", error code: " + status);
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
	    			console.log(actor.creep.name + ": Unable to claim controller at " +
	    				this.target.controller + ", GCL " + Game.gcl.level + " not high enough! Error code: " + status);
	    			break;
	    		default:
	    			console.log(actor.creep.name + ": Unable to claim controller at " +
	    				this.target.controller + ", error code: " + status);
	    			break;
	    	}
	    }

    	return;
    }

    if (this.targetName)
    {
    	let dir = actor.creep.room.findExitTo(this.targetName);
    	if (dir > 0)
    	{
    		if (actor.doDebug)
    			console.log("Exit to target room " + this.targetName + " is in direction " + dir);

    		let exit = actor.creep.pos.findClosestByRange(dir);
    		if (exit)
    		{
    			if (actor.doDebug)
    				console.log("Moving towards exit to " + this.targetName + " at " + exit);

    			actor.creep.moveTo(exit);
    		}
    	}
    	else
    		console.log(actor.creep.name + ": Unable to find exit to target room " + this.targetName);
    }
}

module.exports = Claim.prototype;