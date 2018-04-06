var Utils = require('utils');
var JobBase = require('jobBase');
var Job = require('jobTypes');

function Resupply(opts)
{
	//console.log("JobBase->Resupply.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Resupply";
	this.jobType = Job.Type.Resupply;
	
    this.base = JobBase;
    this.base.constructor(this, opts);

    this.target = null;

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Resupply.prototype = Object.create(JobBase);
Resupply.prototype.constructor = Resupply;

Resupply.prototype.readSaveData = function(data)
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
		this.target = null;

	if (data.waitPos != undefined)
		this.waitPos = waitPos;

	//console.log("Target found based on save data: " + data.target);
	return true;
}

Resupply.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != undefined && this.target != null)
		data.target = this.target.id;
	if (this.waitPos != undefined)
		data.waitPos = this.waitPs;

	return data;
}

Resupply.prototype.getResupplyTarget = function(actor, typeFilter)
{
	var target;
	var targets = [];

	if (this.targets != null && Object.keys(this.targets).length > 0)
	{
		for (var id in this.targets)
		{
			target = this.targets[id];
			if (validateTarget(actor, target))
				targets.push(target);
		}
	}
	else
	{
		targets = actor.creep.room.find(FIND_STRUCTURES,
	    {
	        filter: (structure) =>
	        {
	        	if (typeFilter != undefined && typeFilter.hasOwnProperty(structure.structureType) &&
	        		!typeFilter[structure.structureType])
	        	{
	        		if (actor.doDebug)
	        		{
	        			console.log(actor.creep.name + ": Structure type " + structure +
	        				" was type-filtered out from resupply targets!");
	        		}
	        		
	        		return false;	
	        	}

	        	if ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) &&
	        		validateTarget(actor, structure))
	        	{
	        		return true;
	        	}

	            return false;
	        }
	    });
	}

    if (targets.length > 0)
    	return actor.creep.pos.findClosestByPath(targets);

    if (actor.doDebug)
    	console.log(actor.creep.name + ": Unable to pick Resupply job target!");

    return null;
}

Resupply.prototype.onStart = function(actor)
{
	// Symbol Dec:9641, Hex:25A9, SQUARE WITH DIAGONAL CROSSHATCH FILL, https://www.w3schools.com/charsets/ref_utf_symbols.asp
	actor.creep.say("▩ Resupply!");
}

Resupply.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (actor.creep.carry.energy >= actor.creep.carryCapacity)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": No carry capacity left. Resupplied successfully!");

        this.finish(actor, true);
        return;
    }

    if (this.target && ((this.target.store && this.target.store[RESOURCE_ENERGY] <= 0) || (this.target.energy && this.target.energy <= 0)))
	{
		if (actor.doDebug)
            console.log(actor.creep.name + ": Resupply target " + this.target.name + " is empty!");
		
		this.target = null;
	}

    if (this.target == null)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": Finding new resupply target...");

        this.target = this.getResupplyTarget(actor);

        if (this.target == null)
        {
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": No resupply targets found!");

	        this.finish(actor, false);
	        return;
	    }
    }

    //if (this.target.store <= 0)
    //	this.wait(actor);
    //else if (this.waitPos != undefined)
    //	delete this.waitPos;

	let status = actor.creep.withdraw(this.target, RESOURCE_ENERGY);
	switch (status)
	{
		case OK:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Resupplied from target at " + this.target.pos);

			break;
		case ERR_NOT_ENOUGH_RESOURCES:
            if (actor.doDebug)
                console.log(actor.creep.name + ": No resources left, unable to resupply from target at " + this.target.pos);

            this.finish(actor, false);
            //this.wait(actor);

			break;
		case ERR_NOT_IN_RANGE:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Moving to resupply from target at " + this.target.pos);

	        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
		case ERR_FULL:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Capacity full, unable to resupply from target at " + this.target.pos);

            this.finish(actor, true);

			break;
        case ERR_BUSY:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Creep busy, unable to resupply from target at " + this.target.pos);

            break;
		default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to resupply from target at " + this.target.pos);

			break;
    }
}

Resupply.prototype.wait = function(actor)
{
	if (this.waitPos != undefined)
	{
		console.log("Waiting at " + this.waitPos + " for storage to get resupplied...");
		actor.creep.moveTo(this.waitPos, { visualizePathStyle: { stroke: '#ffaa00' } } );
	}
	else
    {
        var flags = actor.creep.room.find(FIND_FLAGS,
	    {
	        filter: (flag) =>
	        {
	            return flag.name == "Flag.NeutralPosition";
	        }
	    });

	    if (flags.length > 0)
	    	this.waitPos = flags[0].pos;
	    else
	    	console.log("No wait flag found!");
    }
}

module.exports = Resupply.prototype;

/// Internal functions

function validateTarget(actor, target)
{
    var threshold = 0;
    if (actor.creep.memory.resupplyThreshold)
        threshold = actor.creep.memory.resupplyThreshold;

    var amount;
    if (target.energy)
    {
    	if (target.energy < 1)
    	{
            if (actor.doDebug)
                console.log(actor.creep.name + ": Target " + target + " has no energy left!");

    		return false;
    	}

        amount = threshold <= 1.0 ? target.energy / target.energyCapacity : target.energy;

        if (amount < threshold)
        {
            if (actor.doDebug)
            {
                console.log(actor.creep.name + ": Target " + target + " energy level: " +
                    target.energy + "/" + target.energyCapacity + ", " + amount + "<" + threshold + " is too low!");
            }

            return false;
        }
    }
    else if (target.store && target.store[RESOURCE_ENERGY])
    {
    	if (target.store[RESOURCE_ENERGY] < 1)
    	{
            if (actor.doDebug)
                console.log(actor.creep.name + ": Target " + target + " has no energy left!");

    		return false;
    	}

        amount = threshold <= 1.0 ? target.store[RESOURCE_ENERGY] / target.storeCapacity : target.store[RESOURCE_ENERGY];

        if (amount < threshold)
        {
            if (actor.doDebug)
            {
                console.log(actor.creep.name + ": Target " + target + " energy stores: " +
                    target.store[RESOURCE_ENERGY] + "/" + target.storeCapacity + ", " + amount + "<" + threshold + " is too low!");
            }

            return false;
        }
    }
    else
    {
        //console.log(actor.creep.name + ": Target " + target + " doesn't have energy storage at all!");
        return false;
    }


    return true;
}