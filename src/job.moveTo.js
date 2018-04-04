var Utils = require('utils');
var JobBase = require('jobBase');
var Job = require('jobTypes');

function MoveTo(opts)
{
	//console.log("JobBase->MoveTo.constructor(opts: " + Utils.objectToString(opts, 0, 1) + ")");
	this.jobName = "MoveTo";
	this.jobType = Job.Type.MoveTo;
	
    this.base = JobBase;
    this.base.constructor(this, opts);

	if (!opts)
		return;
	
	if (opts.target instanceof Room)
	{
		this.target = opts.target;
		this.targetName = opts.target.name;
	}
	else if (opts.targetName)
		this.targetName = opts.targetName;
	else
		console.log("No target provided for MoveTo job! opts: " + Utils.objectToString(opts, 0, 2));
}

MoveTo.prototype = Object.create(JobBase);
MoveTo.prototype.constructor = MoveTo;

MoveTo.prototype.readSaveData = function(data)
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

	if (data.exitDir)
		this.exitDir = data.exitDir;

	//console.log("Target found based on save data: " + data.target);
	return true;
}

MoveTo.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target)
		data.target = this.target.name;
	else if (this.targetName)
		data.target = this.targetName;
	else
		console.log("No target data to save!");

	if (this.exitDir)
		data.exitDir = this.exitDir;

	return data;
}

MoveTo.prototype.onStart = function(actor)
{
	actor.creep.say("MoveTo!");
}

MoveTo.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (this.target && actor.creep.room == this.target)
    {
    	if (actor.doDebug)
			console.log(actor.creep.name + ": Reached target room " + this.target + " via direction " + this.exitDir);

		if (this.exitDir)
			actor.creep.move(this.exitDir);

		this.finish(actor, true);
		return;
    }

    if (this.targetName)
    {
    	let dir = actor.creep.room.findExitTo(this.targetName);
    	if (dir > 0)
    	{
    		if (actor.doDebug)
    			console.log("Exit to target room " + this.targetName + " is in direction " + dir);

    		this.exitDir = dir;

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

module.exports = MoveTo.prototype;