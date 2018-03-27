var Utils = require('utils');
var JobBase = require('jobPrototype');
var Job = require('jobTypes');

function Supply(opts)
{
	//console.log("JobBase->Supply.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Supply";
	this.jobType = Job.Type.Supply;
	
    this.base = JobBase;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Supply.prototype = Object.create(JobBase);
Supply.prototype.constructor = Supply;

Supply.prototype.readSaveData = function(data)
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

	//console.log("Target found based on save data: " + data.target);
	return true;
};

Supply.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != undefined && this.target != null)
		data["target"] = this.target.id;

	return data;
};

Supply.prototype.onStart = function(actor)
{
	// Symbol Dec:9889, Hex:26A1, HIGH VOLTAGE SIGN, https://www.w3schools.com/charsets/ref_utf_symbols.asp
	actor.creep.say("⚡ Supply!");
}

Supply.prototype.getSupplyTarget = function(actor, typeFilter)
{
	var targets = actor.creep.room.find(FIND_STRUCTURES,
    {
        filter: (structure) =>
        {
        	if (typeFilter != undefined && typeFilter.hasOwnProperty(structure.structureType) && !typeFilter[structure.structureType])
        	{
        		if (actor.doDebug)
        			console.log(actor.creep.name + ": Structure type " + structure + " was type-filtered out from supply targets!");

        		return false;	
        	}

        	if (structure.structureType == STRUCTURE_STORAGE)
        		return structure.store[RESOURCE_ENERGY] < structure.storeCapacity;

            return (structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN ||
                structure.structureType == STRUCTURE_TOWER) &&
            	structure.energy < structure.energyCapacity;
        }
    });

	var target, priority;
	var highestPriority = 0;
    var chosenTargetType = null;
    for (var i = 0; i < targets.length; i++)
    {
    	target = targets[i];
    	switch (target.structureType)
    	{
    		case STRUCTURE_EXTENSION:
    		case STRUCTURE_SPAWN:
    			priority = 3.0;
    			break;
			case STRUCTURE_STORAGE:
				priority = 2.0;
				break;
			case STRUCTURE_TOWER:
				priority = 1.5;
				break;
			default:
				priority = 1.0;
				break;
    	}

    	if (priority > highestPriority)
    	{
    		chosenTargetType = target.structureType;

    		if (actor.doDebug)
    		{
    			console.log(actor.creep.name + ": Highest priority target is now of type " + chosenTargetType +
	    			" priority: " + priority + " > " + highestPriority + ", from target " + target.name +
	    			", energy: " + target.energy + "/" + target.energyCapacity);
    		}

    		highestPriority = priority;
    	}
    }

    if (chosenTargetType != null)
    {
    	target = actor.creep.pos.findClosestByPath(targets.filter(target => target.structureType == chosenTargetType ));
    	
    	if (actor.doDebug)
    		console.log(actor.creep.name + ": Closest target of type " + chosenTargetType + " is at " + target.pos);
    	
    	return target;
    }
    else if (targets.length > 0)
    	return actor.creep.pos.findClosestByPath(targets);

    return null;
}

Supply.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (actor.creep.carry.energy <= 0)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": No energy to supply with!");

        this.finish(actor, true);
        return;
    }

    if (this.target == null)
    {
        this.target = this.getSupplyTarget(actor);

        if (this.target == null)
        {
	        this.finish(actor, false);
	        return;
	    }
    }

	let status = actor.creep.transfer(this.target, RESOURCE_ENERGY);
	switch (status)
	{
		case OK:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Supplied target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
		case ERR_NOT_IN_RANGE:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Moving to supply target at " + this.target.pos.x + "," + this.target.pos.y);

	        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
		case ERR_FULL:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Target full, unable to supply target at " + this.target.pos.x + "," + this.target.pos.y);

            this.target = null;

			break;
        case ERR_BUSY:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Creep busy, unable to supply target at " + this.target.pos.x + "," + this.target.pos.y);

            break;
		default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to supply target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
    }
}

module.exports = Supply.prototype;