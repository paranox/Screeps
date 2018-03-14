var Job = require('jobPrototype');
var JobType = require('jobTypes');

function RepairTarget(opts)
{
	//console.log("Job->RepairTarget.constructor(" + (opts != null && opts != undefined ? opts.entries() : opts) + ")");
	this.jobName = "RepairTarget";
	this.jobType = JobType.RepairTarget;
	
    this.base = Job;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
		this.target = opts.target;
}

RepairTarget.prototype = Object.create(Job);
RepairTarget.prototype.constructor = RepairTarget;

RepairTarget.prototype.readSaveData = function(data)
{
	if (data.target != undefined && data.target != null)
	{
		this.target = Game.getObjectById(data.target);

		if (this.target == null)
		{
			console.log("Target id[" + data.target + "] was not found!");
			return false;
		}
	}
	else
	{
		console.log("Target information was not included in save data: " + data);
		return false;
	}

	//console.log("Target found based on save data: " + data.target);
	return true;
};

RepairTarget.prototype.createSaveData = function()
{
	var data = this.base.createSaveData();
	data["target"] = this.target.id;
	return data;
};

RepairTarget.prototype.onUpdate = function(actor)
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

module.exports = RepairTarget.prototype;