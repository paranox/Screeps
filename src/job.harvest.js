var Utils = require('utils');
var Job = require('jobPrototype');
var JobType = require('jobTypes');

function Harvest(opts)
{
	//console.log("Job->Harvest.constructor(opts: " + Utils.objectToString(opts) + ")");
	this.jobName = "Harvest";
	this.jobType = JobType.Harvest;
	
    this.base = Job;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Harvest.prototype = Object.create(Job);
Harvest.prototype.constructor = Harvest;

Harvest.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data.target != undefined && data.target != null)
	{
		this.target = Game.getObjectById(data.target);

		if (this.target == null)
		{
			console.log("Job" + this.jobName + ": Target id[" + data.target + "] was not found!");
			return false;
		}
	}

	//console.log("Job" + this.jobName + ": Target found based on save data: " + data.target);
	return true;
};

Harvest.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != undefined && this.target != null)
		data["target"] = this.target.id;

	return data;
};

Harvest.prototype.onStart = function(actor)
{
	actor.creep.say("☭ Harvest!");
};

Harvest.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
		console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (this.target == undefined || this.target == null)
    {
		this.target = actor.creep.pos.findClosestByPath(FIND_SOURCES);

		if (this.target == null)
        {
        	console.log(actor.creep.name + ": Can't find a Source!");
	        this.end(actor, false);
        	return;
	    }
    }

    if (actor.creep.carry.energy >= actor.creep.carryCapacity)
	{
		actor.creep.say("█ I'm full!");
		this.end(actor, true);
		return;
	}
    
    var status = actor.creep.harvest(this.target);
    switch (status)
    {
        case OK:
            if (actor.doDebug)
        		console.log(actor.creep.name + ": Harvested from Source at " + this.target.pos.x + "," + this.target.pos.y);

            break;
        case ERR_NOT_IN_RANGE:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Moving to Source at " + this.target.pos.x + "," + this.target.pos.y);

            actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: "#ffaa00" } });

            break;
        case ERR_NOT_ENOUGH_RESOURCES:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Source out of resources at " + source.pos.x + "," + source.pos.y);

			this.end(actor, false);

            break;
        default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to harvest Source at " + source.pos.x + "," + source.pos.y);

            break;
    }
};

module.exports = Harvest.prototype;