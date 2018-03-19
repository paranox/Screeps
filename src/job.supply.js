var Utils = require('utils');
var Job = require('jobPrototype');
var JobType = require('jobTypes');

function Supply(opts)
{
	//console.log("Job->Supply.constructor(opts: " + Utils.objectToString(opts) + ")");
	this.jobName = "Supply";
	this.jobType = JobType.Supply;
	
    this.base = Job;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Supply.prototype = Object.create(Job);
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

Supply.prototype.getSupplyTarget = function(actor)
{
	var targets = actor.creep.room.find(FIND_STRUCTURES,
    {
        filter: (structure) =>
        {
            return (structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN ||
                structure.structureType == STRUCTURE_TOWER) &&
            	structure.energy < structure.energyCapacity;
        }
    });

    if (targets.length > 0)
    	return targets[0];

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