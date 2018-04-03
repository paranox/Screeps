var Utils = require('utils');
var JobBase = require('jobBase');
var Job = require('jobTypes');

function Store(opts)
{
	//console.log("JobBase->Store.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Store";
	this.jobType = Job.Type.Store;
	
    this.base = JobBase;
    this.base.constructor(this, opts);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Store.prototype = Object.create(JobBase);
Store.prototype.constructor = Store;

Store.prototype.readSaveData = function(data)
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

Store.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != undefined && this.target != null)
		data["target"] = this.target.id;

	return data;
};

Store.prototype.onStart = function(actor)
{
	// Symbol Dec:9638, Hex:25A6, SQUARE WITH ORTHOGONAL CROSSHATCH FILL, https://www.w3schools.com/charsets/ref_utf_symbols.asp
	actor.creep.say("▦ Store!");
}

Store.prototype.getStoreTarget = function(actor)
{
	var target = actor.creep.pos.findClosestByPath(FIND_STRUCTURES,
    {
        filter: (structure) =>
        {
            return (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) &&
            	structure.store[RESOURCE_ENERGY] < structure.storeCapacity;
        }
    });

    return target;
}

Store.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (actor.creep.carry.energy <= 0)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": No energy to store!");

        this.finish(actor, true);
        return;
    }

    if (this.target == null)
    {
        this.target = this.getStoreTarget(actor);

        if (this.target == null)
        {
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": No place store energy into!");

	        this.finish(actor, false);
	        return;
	    }
    }

	let status = actor.creep.transfer(this.target, RESOURCE_ENERGY);
	switch (status)
	{
		case OK:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Transfered energy to target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
		case ERR_NOT_IN_RANGE:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Moving to store energy to target at " + this.target.pos.x + "," + this.target.pos.y);

	        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
		case ERR_FULL:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Target full, unable to store energ to target at " + this.target.pos.x + "," + this.target.pos.y);

            this.target = null;

			break;
        case ERR_BUSY:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Creep busy, unable to store energy to target at " + this.target.pos.x + "," + this.target.pos.y);

            break;
		default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to store energy to target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
    }
}

module.exports = Store.prototype;