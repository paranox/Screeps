var Utils = require('utils');
var Job = require('jobPrototype');
var JobType = require('jobTypes');

function Upgrade(opts)
{
	//console.log("Job->Upgrade.constructor(opts: " + Utils.objectToString(opts) + ")");
	this.jobName = "Upgrade";
	this.jobType = JobType.Upgrade;
	
    this.base = Job;
    this.base.constructor(this);

	if (opts != undefined && opts != null)
	{
		if (opts.target != null)
			this.target = opts.target;
	}
}

Upgrade.prototype = Object.create(Job);
Upgrade.prototype.constructor = Upgrade;

Upgrade.prototype.readSaveData = function(data)
{
	return this.base.readSaveData(this, data);
};

Upgrade.prototype.createSaveData = function()
{
	return this.base.createSaveData(this);
};

Upgrade.prototype.onStart = function(actor)
{
	// Symbol Dec:9762, Hex:2622, RADIOACTIVE SIGN, https://www.w3schools.com/charsets/ref_utf_symbols.asp
	actor.creep.say("☢ Upgrade!");
}

Upgrade.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    this.target = actor.creep.room.controller;
    if (this.target == null)
    {
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

        this.end(actor, false);
        return;
    }

    if (actor.creep.carry.energy <= 0)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": No energy to upgrade with!");

        this.end(actor, true);
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
                ") when trying to upgrade Controller at " + this.target.pos.x + "," + this.target.pos.y);

			break;
    }
};

module.exports = Upgrade.prototype;