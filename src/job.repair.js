var Utils = require('utils');
var Job = require('jobPrototype');
var JobType = require('jobTypes');

function Repair(opts)
{
	//console.log("Job->Repair.constructor(opts: " + Utils.objectToString(opts) + ")");
	this.jobName = "Repair";
	this.jobType = JobType.Repair;
	
    this.base = Job;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Repair.prototype = Object.create(Job);
Repair.prototype.constructor = Repair;

Repair.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data.target != undefined && data.target != null)
	{
		let target = Game.getObjectById(data.target);

		if (target == null)
		{
			console.log("Target id[" + data.target + "] was not found!");
			return false;
		}

		this.target = target;
	}
	else
	{
		console.log("Target information was not included in save data: " + Utils.objectToString(data));
		return false;
	}

	//console.log("Target found based on save data: " + data.target);
	return true;
};

Repair.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != undefined && this.target != null)
		data["target"] = this.target.id;

	return data;
}

Repair.prototype.getRepairTarget = function(room)
{
    var allTarges = room.find(FIND_STRUCTURES, { filter: (s) =>
        { return s.hits != undefined && s.hitsMax != undefined && s.hits < s.hitsMax; } });

    var target = null;
    var chosenTarget = null;
    var priority = 0.0;
    var highestPriority = 0.0;
    for (var i = 0; i < allTarges.length; i++)
    {
        target = allTarges[i];

        priority = 1.0 - target.hits / target.hitsMax;

        switch (target.structureType)
        {
            case STRUCTURE_RAMPART:
            case STRUCTURE_TOWER:
                priority *= 2.0;
                break;
            case STRUCTURE_CONTAINER:
            case STRUCTURE_STORAGE:
            case STRUCTURE_EXTENSION:
                priority *= 1.5;
                break;
            case STRUCTURE_ROAD:
                priority *= 0.75;
                break;
            case STRUCTURE_WALL:
                priority *= 0.5;
                break;
        }

        //console.log("Target[" + i + "/" + allTarges.length + "]" + target.structureType +
        //    " at " + target.pos + " has priority " + priority + ", hits: " + target.hits + "/" + target.hitsMax);

        if (priority > highestPriority)
        {
            //console.log("Target[" + i + "/" + allTarges.length + "]" + target.structureType +
            //    " at " + target.pos + " now has highest priority " + priority + ", hits: " + target.hits + "/" + target.hitsMax);

            highestPriority = priority;
            chosenTarget = target;
        }
    }

    if (chosenTarget == null && allTarges.length > 0)
    {
    	chosenTarget = allTarges[0];
    	console.log("Unable to prioritize targets. Target " + chosenTarget.structureType + " at " + target.pos + " was picked!");
    }
    //else
    //    console.log("Target " + chosenTarget.structureType + " at " + target.pos + " was chosen!");

    return chosenTarget;
}

Repair.prototype.onStart = function(actor)
{
	actor.creep.say("⚒ Repair!");
}

Repair.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (this.target == undefined || this.target == null)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": Nothing to repair!");

        this.end(actor, false);
        return;
    }

    if (actor.creep.carry.energy <= 0)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": No energy to repair with!");

        this.end(actor, true);
        return;
    }

	if (this.target.hits >= this.target.hitsMax)
	{
		if (actor.doDebug)
        {    
    		console.log(actor.creep.name + ": Target " + this.target.name + " at " +
    			this.target.pos.x + "," + this.target.pos.y + " is fully repaired!");
		}

        this.end(actor, true);
        return;
	}

	let status = actor.creep.repair(this.target);
	switch (status)
	{
		case OK:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Repaired target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
		case ERR_NOT_IN_RANGE:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Moving to repair target at " + this.target.pos.x + "," + this.target.pos.y);

	        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
		default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to repair target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
    }
};

module.exports = Repair.prototype;