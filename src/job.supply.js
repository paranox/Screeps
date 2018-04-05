var Utils = require('utils');
var JobBase = require('jobBase');
var Job = require('jobTypes');

function Supply(opts)
{
	//console.log("JobBase->Supply.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Supply";
	this.jobType = Job.Type.Supply;
	
    this.base = JobBase;
    this.base.constructor(this, opts);

    this.targets = {};

	if (opts == null)
		return;
	
	if (opts.targets != undefined)
	{
		if (Array.isArray(opts.targets))
		{
			for (var id in opts.targets)
				this.targets[id] = opts.targets[id];
		}
		else
			this.targets = opts.targets;
	}
	if (opts.target != null)
		this.targets[opts.target.id] = opts.target;
}

Supply.prototype = Object.create(JobBase);
Supply.prototype.constructor = Supply;

Supply.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data.target != null)
		this.target = Game.getObjectById(data.target);
	if (Array.isArray(data.targets))
	{
		for (var i = 0; i < data.targets.length; i++)
			this.targets[data.targets[i]] = Game.getObjectById(data.targets[i]);
	}

	//console.log("Target found based on save data: " + data.target);
	return true;
};

Supply.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != null)
		data["target"] = this.target.id;
	if (this.targets != null)
	{
		var targets = [];
		for (var id in this.targets)
		{
			if (this.targets[id])
				targets.push(this.targets[id].id);
		}
		data["targets"] = targets;
	}

	return data;
};

Supply.prototype.onStart = function(actor)
{
	// Symbol Dec:9889, Hex:26A1, HIGH VOLTAGE SIGN, https://www.w3schools.com/charsets/ref_utf_symbols.asp
	actor.creep.say("⚡ Supply!");
}

Supply.prototype.getSupplyTarget = function(actor, typeFilter)
{
	var targets = [];

	var target;
	for (var id in this.targets)
	{
		target = this.targets[id];
		if (target.energyCapacity != undefined)
		{
			if (target.energy < target.energyCapacity)
			{
				if (actor.doDebug)
					console.log("Object " + id + " " + target + " has " + target.energy + "/" + target.energyCapacity + " energy!");

				targets.push(target);
			}
			else if (actor.doDebug)
				console.log("Object " + id + " " + target + " is full of energy!");
		}
		else if (target.storeCapacity != undefined)
		{
			if (target.store[RESOURCE_ENERGY] < target.storeCapacity)
			{
				if (actor.doDebug)
					console.log("Object " + id + " " + target + " has " + target.store[RESOURCE_ENERGY] + "/" + target.storeCapacity + " energy!");

				targets.push(target);
			}
			else if (actor.doDebug)
				console.log("Object " + id + " " + target + " store is full of energy!");
		}
		else if (actor.doDebug)
			console.log("Object " + id + " " + target + " is ineligible for Supply target");
	}

	if (targets.length == 0)
	{
		targets = actor.creep.room.find(FIND_STRUCTURES,
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
	}

	if (targets.length == 0)
		return null;

	var priority;
	var highestPriority = 0;
    var chosenTargetType = null;
    for (var i = 0; i < targets.length; i++)
    {
    	target = targets[i];
    	switch (target.structureType)
    	{
			case STRUCTURE_TOWER:
				priority = 3.0;
				break;
    		case STRUCTURE_EXTENSION:
    		case STRUCTURE_SPAWN:
    			priority = 1.5;
    			break;
			case STRUCTURE_STORAGE:
				priority = 1.25;
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
    			var energy, capacity;
    			if (target.energy) energy = target.energy;
    			if (target.store) energy = target.store[RESOURCE_ENERGY];
    			if (target.energyCapacity) capacity = target.energyCapacity;
    			if (target.storeCapacity) capacity = target.storeCapacity;

    			console.log(actor.creep.name + ": Highest priority target type is now of type " + chosenTargetType +
	    			" priority: " + priority + " > " + highestPriority + ", from target " + target +
	    			", energy: " + energy + "/" + capacity);
    		}

    		highestPriority = priority;
    	}
    }

    if (chosenTargetType)
    {
    	var filteredTargets = targets.filter(target => target.structureType == chosenTargetType);
    	if (filteredTargets.length == 0)
    	{
    		if (actor.doDebug)
    		{
    			console.log(actor.creep.name + ": Couldn't find filtered targets of type: " + chosenTargetType +
    				", out of list: " + targets);
    		}

    		return targets[0];
    	}

    	target = actor.creep.pos.findClosestByPath(filteredTargets);
    	
    	if (target)
    	{
	    	if (actor.doDebug)
	    		console.log(actor.creep.name + ": Closest target of type " + chosenTargetType + " is at " + target.pos);
    	}
    	else
    	{
    		target = filteredTargets[0];

    		if (actor.doDebug)
    		{
    			console.log(actor.creep.name + ": Couldn't find a target out of filtered list: " + filteredTargets +
    				", picked " + target);
    		}
    	}
    	
    	return target;
    }
    else if (targets.length > 0)
    	return actor.creep.pos.findClosestByPath(targets);

    if (actor.doDebug)
    	console.log(actor.creep.name + ": Unable to pick Supply job target!");

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