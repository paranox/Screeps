var Utils = require('utils');
var JobBase = require('jobBase');
var Job = require('jobTypes');

function Pickup(opts)
{
	//console.log("JobBase->Pickup.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Pickup";
	this.jobType = Job.Type.Pickup;
	
    this.base = JobBase;
    this.base.constructor(this, opts);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Pickup.prototype = Object.create(JobBase);
Pickup.prototype.constructor = Pickup;

Pickup.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data.target)
		this.target = Game.getObjectById(data.target);

	return true;
};

Pickup.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != undefined && this.target != null)
		data["target"] = this.target.id;

	return data;
};

Pickup.prototype.onStart = function(actor)
{
	// Symbol Dec:9638, Hex:25A6, SQUARE WITH ORTHOGONAL CROSSHATCH FILL, https://www.w3schools.com/charsets/ref_utf_symbols.asp
	actor.creep.say("▦ Pickup!");
}

Pickup.prototype.getPickupTarget = function(actor, typeFilter)
{
	var target = actor.creep.pos.findClosestByPath(FIND_TOMBSTONES, 
		{ filter: (tombstone) => { return tombstone.store[RESOURCE_ENERGY] > 0; } }
	);

	if (target != null)
		return target;

	target = actor.creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES,
    {
        filter: (resource) =>
        {
	    	if (typeFilter != undefined && typeFilter.hasOwnProperty(resource.resourceType) && !typeFilter[resource.resourceType])
	    	{
	    		if (actor.doDebug)
	    			console.log(actor.creep.name + ": Resource " + resource + " was type-filtered out from pickup targets!");

	    		return false;	
	    	}

            return true;
        }
    });

    return target;
}

Pickup.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (this.target == null)
    {
        this.target = this.getPickupTarget(actor);

        if (this.target == null)
        {
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Nothing to pick up!");

	        this.finish(actor, false);
	        return;
	    }
    }

    if (this.target instanceof Resource)
    {
		//console.log(actor.creep.name + ": Pickup job: target resource: " + this.target);
		let status = actor.creep.pickup(this.target);
		switch (status)
		{
			case OK:
		        if (actor.doDebug)
		        {
		            console.log(actor.creep.name + ": Picked up target at " + this.target.pos +
		            	", resources: " + this.target.amount + " of " + this.target.resourceType);
		        }

				break;
			case ERR_NOT_IN_RANGE:
		        if (actor.doDebug)
		            console.log(actor.creep.name + ": Moving to pickup target at " + this.target.pos);

		        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

				break;
			case ERR_FULL:
	            if (actor.doDebug)
	                console.log(actor.creep.name + ": Creep full, unable to pickup target at " + this.target.pos);

	            this.finish(actor, true);

				break;
	        case ERR_BUSY:
	            if (actor.doDebug)
	                console.log(actor.creep.name + ": Creep busy, unable to pickup target at " + this.target.pos);

	            break;
			default:
	            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
	                ") when trying to pickup target at " + this.target.pos);

				break;
	    }
	}
	else if (this.target instanceof Tombstone)
	{
		//console.log(actor.creep.name + ": Pickup job: target tombstone: " + this.target);
		let status = actor.creep.withdraw(this.target, RESOURCE_ENERGY);
		switch (status)
		{
			case OK:
		        if (actor.doDebug)
		        {
		            console.log(actor.creep.name + ": Withdrew resources from tombstone at " + this.target.pos +
		            	", resources: " + this.target.store[RESOURCE_ENERGY] + " of " + RESOURCE_ENERGY);
		        }

				break;
			case ERR_NOT_IN_RANGE:
		        if (actor.doDebug)
		            console.log(actor.creep.name + ": Moving to pickup from tombstone at " + this.target.pos);

		        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

				break;
			case ERR_NOT_ENOUGH_RESOURCES:
	            if (actor.doDebug)
	                console.log(actor.creep.name + ": No resources left, unable to pickup from tombstone at " + this.target.pos);

	            this.finish(actor, true);

				break;
			case ERR_FULL:
	            if (actor.doDebug)
	                console.log(actor.creep.name + ": Creep full, unable to pickup from tombstone at " + this.target.pos);

	            this.finish(actor, true);

				break;
	        case ERR_BUSY:
	            if (actor.doDebug)
	                console.log(actor.creep.name + ": Creep busy, unable to pickup target at " + this.target.pos);

	            break;
			default:
	            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
	                ") when trying to pickup from tombstone at " + this.target.pos);

				break;
	    }
	}
	else
	{
		console.log(actor.creep.name + ": Unhandled pickup target type: " + this.target);
		//this.finish(actor, false);
	}
}

module.exports = Pickup.prototype;