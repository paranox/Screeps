var Utils = require('utils');
var JobBase = require('jobPrototype');
var Job = require('jobTypes');

function Upgrade(opts)
{
	//console.log("JobBase->Upgrade.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Upgrade";
	this.jobType = Job.Type.Upgrade;
	
    this.base = JobBase;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Upgrade.prototype = Object.create(JobBase);
Upgrade.prototype.constructor = Upgrade;

Upgrade.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data.target != undefined)
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
}

Upgrade.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != undefined && this.target != null)
		data["target"] = this.target.id;

	return data;
}

Upgrade.prototype.onStart = function(actor)
{
	// Symbol Dec:9762, Hex:2622, RADIOACTIVE SIGN, https://www.w3schools.com/charsets/ref_utf_symbols.asp
	actor.creep.say("☢ Upgrade!");
}

Upgrade.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    this.target = actor.home.controller;
    if (this.target == null)
    {
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

        this.finish(actor, false);
        return;
    }

    if (actor.creep.carry.energy <= 0)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": No energy to upgrade with!");

        this.finish(actor, true);
        return;
    }

	let status = actor.creep.upgradeController(this.target);
	switch (status)
	{
		case OK:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Upgraded Controller at " + this.target.pos.x + "," + this.target.pos.y);

			break;
		case ERR_NOT_IN_RANGE:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Moving to upgrade Controller at " + this.target.pos.x + "," + this.target.pos.y);

	        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
        case ERR_BUSY:
            if (actor.doDebug)
                console.log(actor.creep.name + ": Creep busy, unable to upgrade Controller at " + this.target.pos.x + "," + this.target.pos.y);

            break;
		default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to upgrade Controller " + this.target.id + " in " + this.target.room + " at " + this.target.pos.x + "," + this.target.pos.y);

			break;
    }
}

module.exports = Upgrade.prototype;