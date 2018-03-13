var Job = require('jobPrototype');
var JobType = require('jobTypes');

function RepairTarget(jobIndex, opts)
{
	//console.log("RepairTarget.constructor(" + jobIndex + ")");
    this.base = Job;
    this.base.constructor(JobType.RepairTarget, "RepairTarget");

	this.doDebug = true;

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

	console.log("Target found based on save data: " + data.target);
	return true;
};

RepairTarget.prototype.createSaveData = function()
{
	var data = this.base.createSaveData();
	data["target"] = this.target.id;
	return data;
};

RepairTarget.prototype.run = function(creep)
{
	console.log(creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (this.target == null)
    {
        if (this.doDebug)
            console.log(creep.name + ": Nothing to repair!");

        this.end(creep, false);
    }

    if (creep.carry.energy <= 0)
    {
        if (this.doDebug)
            console.log(creep.name + ": No energy to repair with!");

        this.end(creep, true);
        return;
    }

	if (this.target.hits >= this.target.hitsMax)
	{
		if (this.doDebug)
        {    
    		console.log(creep.name + ": Target " + this.target.name + " at " +
    			this.target.pos.x + "," + this.target.pos.y + " is fully repaired!");
		}

        this.end(creep, true);
        return;
	}

	let status = creep.repair(this.target);
	switch (status)
	{
		case OK:
	        if (this.doDebug)
	            console.log(creep.name + ": Repaired target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
		case ERR_NOT_IN_RANGE:
	        if (this.doDebug)
	            console.log(creep.name + ": Moving to repair target at " + this.target.pos.x + "," + this.target.pos.y);

	        creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
		default:
            console.log(creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to repair target at " + this.target.pos.x + "," + this.target.pos.y);

			break;
    }
};

module.exports = RepairTarget.prototype;