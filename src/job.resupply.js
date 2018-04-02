var Utils = require('utils');
var JobBase = require('jobPrototype');
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
		data["target"] = this.target.id;
	if (this.waitPos != undefined)
		data["waitPos"] = this.waitPs;

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
			if (target.energyCapacity != undefined)
			{
				if (target.energy > 0)
				{
					if (actor.doDebug)
						console.log("Object " + id + " " + target + " has " + target.energy + "/" + target.energyCapacity + " energy!");

					targets.push(target);
				}
				else if (actor.doDebug)
					console.log("Object " + id + " " + target + " is out of energy!");
			}
			else if (target.storeCapacity != undefined)
			{
				if (target.store[RESOURCE_ENERGY] > 0)
				{
					if (actor.doDebug)
						console.log("Object " + id + " " + target + " has " + target.store[RESOURCE_ENERGY] + "/" + target.storeCapacity + " energy!");

					targets.push(target);
				}
				else if (actor.doDebug)
					console.log("Object " + id + " " + target + " store is out of energy!");
			}
			else if (actor.doDebug)
				console.log("Object " + id + " " + target + " is ineligible for Supply target");
		}
	}
	else
	{
		targets = actor.creep.room.find(FIND_STRUCTURES,
	    {
	        filter: (structure) =>
	        {
	        	if (typeFilter != undefined && typeFilter.hasOwnProperty(structure.structureType) && !typeFilter[structure.structureType])
	        	{
	        		if (actor.doDebug)
	        			console.log(actor.creep.name + ": Structure type " + structure + " was type-filtered out from resupply targets!");
	        		
	        		return false;	
	        	}

	            return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) &&
	            	structure.store[RESOURCE_ENERGY] > 0;
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

    if (this.target != null && this.target.store[RESOURCE_ENERGY] <= 0)
	{
		if (actor.doDebug)
            console.log(actor.creep.name + ": Resupply target " + this.target.name + " store empty!");

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
	            console.log(actor.creep.name + ": Resupplied from target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
		case ERR_NOT_ENOUGH_RESOURCES:
            if (actor.doDebug)
                console.log(actor.creep.name + ": No resources left, unable to resupply from target at " + this.target.pos.x + "," + this.target.pos.y);

            this.wait(actor);

			break;
		case ERR_NOT_IN_RANGE:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Moving to resupply from target at " + this.target.pos.x + "," + this.target.pos.y);

	        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
		case ERR_FULL:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Capacity full, unable to resupply from target at " + this.target.pos.x + "," + this.target.pos.y);

            this.finish(actor, true);

			break;
        case ERR_BUSY:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Creep busy, unable to resupply from target at " + this.target.pos.x + "," + this.target.pos.y);

            break;
		default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to resupply from target at " + this.target.pos.x + "," + this.target.pos.y);

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