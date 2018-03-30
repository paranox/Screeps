var Utils = require('utils');
var JobBase = require('jobPrototype');
var Job = require('jobTypes');

function Build(opts)
{
	//console.log("JobBase->Build.constructor(opts: " + JSON.stringify(opts) + ")");
	this.jobName = "Build";
	this.jobType = Job.Type.Build;
	
    this.base = JobBase;
    this.base.constructor(this);

    this.target = null;

	if (!opts)
        return;
    
    if (opts.target != null)
        this.target = opts.target;
    if (opts.pos != undefined)
        this.targetPos = opts.pos;
    if (opts.structureType != undefined)
        this.targetStructureType = opts.structureType;
	
	if (opts.target != null)
	{
		this.target = opts.target;
		this.targetID = opts.target.id;
		this.targetPos = opts.target.pos;
        this.targetStructureType = opts.target.structureType;
	}
}

Build.prototype = Object.create(JobBase);
Build.prototype.constructor = Build;

Build.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data.target != undefined)
		this.target = Game.getObjectById(data.target);
	else
		this.target = null;

    if (this.target != null)
    {
        this.targetPos = this.target.pos;
        this.targetStructureType = this.target.structureType;
    }
    else
    {
        if (data.pos != undefined)
            this.targetPos = new RoomPosition(data.pos.x, data.pos.y, data.pos.roomName);

        this.targetStructureType = data.targetStructureType;
    }

	//console.log("Target found based on save data: " + data.target);
	return true;
}

Build.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

    if (this.target != null)
    {
        data.target = this.target.id;
        data.pos = this.target.pos;
        data.targetStructureType = this.target.structureType;
    }
    else
    {
        data.pos = this.targetPos;
        data.targetStructureType = this.targetStructureType;
    }

	return data;
}

Build.prototype.getBuildTarget = function(actor)
{
    var allTarges = actor.creep.room.find(FIND_CONSTRUCTION_SITES);

    var target = null;
    var chosenTarget = null;
    var priority = 0.0;
    var highestPriority = 0.0;
    for (var i = 0; i < allTarges.length; i++)
    {
        target = allTarges[i];

        switch (target.structureType)
        {
            case STRUCTURE_RAMPART:
            case STRUCTURE_TOWER:
                priority = 2.0;
                break;
            case STRUCTURE_EXTENSION:
            	priority = 1.75;
            	break;
            case STRUCTURE_CONTAINER:
            case STRUCTURE_STORAGE:
                priority = 1.5;
                break;
            case STRUCTURE_WALL:
                priority = 0.75;
                break;
            case STRUCTURE_ROAD:
                priority = 0.5;
                break;
            default:
                priority = 1.0;
        }

        priority += target.progress / target.progressTotal;
        priority -= actor.creep.pos.getRangeTo(target) / 20.0;

        //console.log("Build Target[" + i + "/" + allTarges.length + "]" + target.structureType + " at " + target.pos +
        //	" has priority " + priority + ", " + (Math.round(100 * target.progress / target.progressTotal) / 100) +
        //	"% progress: " + target.progress + "/" + target.progressTotal);

        if (priority > highestPriority)
        {
            //console.log("Build Target[" + i + "/" + allTarges.length + "]" + target.structureType + " at " + target.pos +
            //    " now has highest priority " + priority + ", " + (Math.round(100 * target.progress / target.progressTotal) / 100) +
            //    "% progress: " + target.progress + "/" + target.progressTotal);

            highestPriority = priority;
            chosenTarget = target;
        }
    }

    if (chosenTarget == null && allTarges.length > 0)
    {
    	chosenTarget = allTarges[0];
    	console.log("Unable to prioritize Build targets. Target " + chosenTarget.structureType + " at " + target.pos + " was picked!");
    }
    //else
    //    console.log("Target " + chosenTarget.structureType + " at " + target.pos + " was chosen!");

    return chosenTarget;
}

Build.prototype.onStart = function(actor)
{
	// Symbol Dec:9874, Hex:2692, HAMMER AND PICK, https://www.w3schools.com/charsets/ref_utf_symbols.asp
	actor.creep.say("⚒ Build!");
}

Build.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    if (!this.target)
    {
        // If there was a target position, there was a target at some point
		if (this.targetPos != undefined)
		{
			this.finish(actor, true);
			return;
		}
		else
		{
			console.log(actor.creep.name + ": Unknown build target, unknown position!");
			this.finish(actor, false);
			return;
		}

        // Try to immediately get a new target
    	this.target = this.getBuildTarget(actor.creep.room);

    	if (this.target == null)
        {
        	if (actor.doDebug)
            	console.log(actor.creep.name + ": Nothing to build!");

	        this.finish(actor, true);
	        return;
        }

    	this.targetPos = this.target.pos;
    }

    if (actor.creep.carry.energy <= 0)
    {
        if (actor.doDebug)
            console.log(actor.creep.name + ": No energy to build with!");

        this.finish(actor, true);
        return;
    }

	let status = actor.creep.build(this.target);
	switch (status)
	{
		case OK:
			if (this.target.progress < this.target.progressTotal)
	        {
	        	if (actor.doDebug)
	            	console.log(actor.creep.name + ": Worked to construct target at " + this.targetPos);
	        }

			break;
		case ERR_NOT_IN_RANGE:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Moving to construct target at " + this.targetPos);

	        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
		case ERR_NOT_ENOUGH_RESOURCES:
	        if (actor.doDebug)
	            console.log(actor.creep.name + ": Out of energy to construct " + this.targetPos);

	        actor.creep.moveTo(this.target, { visualizePathStyle: { stroke: '#ffaa00' } } );

			break;
		default:
            console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                ") when trying to construct target at " + this.targetPos);

			break;
    }
}

Build.prototype.onFinish = function(actor, isDone)
{
	this.base.onFinish(actor, isDone);

	if (actor.doDebug)
	{
    	console.log(actor.creep.name + ": Finished constructing target at " +
    		(this.targetPos != undefined ? this.targetPos : "undefined"));
	}

    if (this.targetStructureType == STRUCTURE_RAMPART || this.targetStructureType == STRUCTURE_WALL)
    {
        actor.addJob(Game.empire.factories.job.createFromType(Job.Type.Repair,
            { for: actor.creep.name, pos:this.targetPos, structureType:this.targetStructureType }));
    }

    this.target = null;
}

module.exports = Build.prototype;