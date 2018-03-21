var Utils = require('utils');
var JobBase = require('jobPrototype');
var Job = require('jobTypes');

function Repair(opts)
{
	//console.log("JobBase->Repair.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Repair";
	this.jobType = Job.Type.Repair;
	
    this.base = JobBase;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Repair.prototype = Object.create(JobBase);
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
		console.log("Target information was not included in save data: " + JSON.stringify(data));
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
    var targetHealth;
    var chosenTarget = null;
    var priority = 0.0;
    var highestPriority = 0.0;
    for (var i = 0; i < allTarges.length; i++)
    {
        target = allTarges[i];

        targetHealth = target.hits / target.hitsMax;
    	if (targetHealth >= 0.95)
    		continue;

        priority = 1.0 - targetHealth;

        switch (target.structureType)
        {
            case STRUCTURE_RAMPART:
            case STRUCTURE_TOWER:
            	priority *= (targetHealth < 0.25 ? 2.0 : 1.25);
                break;
            case STRUCTURE_CONTAINER:
            case STRUCTURE_STORAGE:
            case STRUCTURE_EXTENSION:
		    	if (targetHealth >= 0.75)
		    		continue;
                priority *= 1.125;
                break;
            case STRUCTURE_WALL:
		    	if (targetHealth >= 0.25)
		    		continue;
		    	if (targetHealth <= 0.1)
		    		priority *= 1.5;
                break;
            case STRUCTURE_ROAD:
		    	if (targetHealth >= 0.5)
		    		continue;
                priority *= 0.75;
                break;
        }

        //console.log("Repair Target[" + i + "/" + allTarges.length + "]" + target.structureType +
        //    " at " + target.pos + " has priority " + priority + ", " + () + " hits: " + target.hits + "/" + target.hitsMax);

        if (priority > highestPriority)
        {
            //console.log("Repair Target[" + i + "/" + allTarges.length + "]" + target.structureType + " at " + target.pos +
            //    " now has highest priority " + priority + ", " + (Math.round(100 * target.hits / target.hitsMax) / 100) +
            //    "% hits: " + target.hits + "/" + target.hitsMax);

            highestPriority = priority;
            chosenTarget = target;
        }
    }

    if (chosenTarget == null && highestPriority > 0.0 && allTarges.length > 0)
    {
    	chosenTarget = allTarges[0];
    	console.log("Unable to prioritize Repair targets. Target " + chosenTarget.structureType + " at " + target.pos + " was picked!");
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

        this.finish(actor, false);
        return;
    }

    if (actor.creep.carry.energy <= 0)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": No energy to repair with!");

        this.finish(actor, true);
        return;
    }

	if (this.target.hits >= this.target.hitsMax)
	{
		if (actor.doDebug)
        {    
    		console.log(actor.creep.name + ": Target " + this.target.name + " at " +
    			this.target.pos.x + "," + this.target.pos.y + " is fully repaired!");
		}

        this.finish(actor, true);
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