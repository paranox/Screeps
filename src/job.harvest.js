var Utils = require('utils');
var JobBase = require('jobPrototype');
var Job = require('jobTypes');

function Harvest(opts)
{
	//console.log("JobBase->Harvest.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Harvest";
	this.jobType = Job.Type.Harvest;
	
    this.base = JobBase;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Harvest.prototype = Object.create(JobBase);
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
		this.target = actor.creep.pos.findClosestByPath(FIND_SOURCES, { filter : (source) =>
			{
				return source.energy > 0;
			}
		});

		if (this.target == null)
        {
        	console.log(actor.creep.name + ": Can't find a Source!");
	        this.finish(actor, false);
        	return;
	    }
    }

    if (actor.creep.carry.energy >= actor.creep.carryCapacity)
	{
		actor.creep.say("█ I'm full!");
		this.finish(actor, true);
		return;
	}
    
    var status = actor.creep.harvest(this.target);
    switch (status)
    {
        case OK:
            if (actor.doDebug)
        		console.log(actor.creep.name + ": Harvested energy from Source at " + this.target.pos.x + "," + this.target.pos.y);

            break;
        case ERR_NOT_IN_RANGE:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Moving to Source at " + this.target.pos.x + "," + this.target.pos.y);

            actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: "#ffaa00" } });

            break;
        case ERR_BUSY:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Creep busy, unable to harvest Source at " + this.target.pos.x + "," + this.target.pos.y);

            break;
        case ERR_NOT_ENOUGH_RESOURCES:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Source out of resources at " + this.target.pos.x + "," + this.target.pos.y);

			this.finish(actor, false);

            break;
        default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to harvest Source at " + this.target.pos.x + "," + this.target.pos.y);

            break;
    }
};

module.exports = Harvest.prototype;