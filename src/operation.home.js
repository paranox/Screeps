var Utils = require('utils');
var Operation = require('operationTypes');
var OperationBase = require('operationBase');
var Role = require('roleTypes');
var JobFactory = require('jobFactory');
var Job = require('jobTypes');
var CreepFactory = require('creepFactory');

function Home(opts)
{
	//console.log("OperationBase->Home.constructor(opts: " + JSON.stringify(opts) + ")");
	this.opName = "Home";
	this.opType = Operation.Type.Home;
	
    this.base = OperationBase;
    this.base.constructor(this, opts);

	this.home.roomLevel = 0;

    if (!opts) return;

    if (opts.home != null)
    {
    	if (opts.home.room != undefined)
    		this.home.room = opts.home.room;
    	if (opts.home.spawn != undefined)
    		this.home.spawn = opts.home.spawn;
	}
}

/// Memory functions, should always be called via context's override
/// NOTE: These require a context reference and are usually

Home.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data != null)
	{
		if (data.home != null)
		{
			if (data.home.roomLevel != undefined)
				this.home.roomLevel = data.home.roomLevel;
		}
	}

	return true;
}

Home.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);
	
	data.home["roomLevel"] = this.home.roomLevel;

	return data;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

Home.prototype.onUpdate = function()
{
	this.home.roomLevel = this.home.room.controller.level;

    var spawn = this.home.spawn;
    if (!spawn)
    {
        console.log("Unable to find home spawn!");
        return;
    }

    var spawnQueue = spawn.memory.spawnQueue;
    if (!spawnQueue)
    {
        console.log("Initializing spawn queue!");
        spawnQueue = [];
        spawn.memory.spawnQueue = spawnQueue;
    }

    if (spawn.spawning)
    {
    	//console.log("Spawn " + spawn.name + " is spawning: " + Utils.objectToString(spawn.spawning, 0, 2));
    	return;
    }
    else
    {
    	if (spawn.memory.spawning != null)
    	{
    		console.log("Spawn " + spawn.name + " is done spawning: " + Utils.objectToString(spawn.spawning, 0, 2));
            spawn.memory.spawning = null;
    	}
    }

    const energyAvailable = spawn.room.energyAvailable;
    const energyCapacity = spawn.room.energyCapacityAvailable;

    var chosenBlueprint = null;

    var nextBlueprint = CreepFactory.getBlueprintFromSpawnQueue(spawn);
    if (nextBlueprint != null)
    {
        if (nextBlueprint.cost > energyAvailable)
        {
            //console.log("Blueprint cost " + nextBlueprint.cost + " is higher than available energy " +
            //    energyAvailable + ", waiting...");
        }
        else
        {
        	CreepFactory.tryRemoveBlueprintFromSpawnQueue(spawn);

            if (nextBlueprint.allowUpdate == true && energyAvailable > nextBlueprint.budget)
            {
                console.log("Energy capacity, and stored energy, have increased since creating blueprint:\n" +
            		JSON.stringify(nextBlueprint));

                chosenBlueprint = CreepFactory.buildBlueprintByRole(nextBlueprint.opts.memory.role, energyAvailable, 50);
                console.log("Created new blueprint:\n" + JSON.stringify(chosenBlueprint));
            }
            else
                chosenBlueprint = nextBlueprint;
        }
    }

    if (chosenBlueprint != null)
    {
    	spawn.memory.spawning = chosenBlueprint;
        CreepFactory.buildCreepFromBlueprint(spawn, chosenBlueprint);
    }
}

Home.prototype.getJob = function(actor)
{
	//if (actor.creep.carry.energy >= actor.creep.carryCapacity)
	//{
	//	//console.log("Operation " + this.opName + ": Actor full of energy!");
	//	return null;
	//}
	//
	//if (this.target == null)
	//{
	//	console.log("Operation " + this.opName + ": No target specified!");
	//	return null;
	//}
	//
	//if (this.target.energy == 0)
	//{
	//	if (this.doDebug)
	//		console.log("Operation " + this.opName + ": Target " + this.target + " at " + this.target.pos + " has no energy left!");
	//	
	//	return null;
	//}
	//
	//return JobFactory.createFromType(Job.Type.Harvest, { "for": actor.creep.name, "target": this.target } );
	return null;
}

Home.prototype.createDefaultRoles = function()
{
	var roles = {};
    roles[Role.Type.Builder]    = Operation.createRolePositionObject(Role.Type.Builder,   0, 1, 3, [1.5, 1.0]);
    roles[Role.Type.Harvesters] = Operation.createRolePositionObject(Role.Type.Harvester, 0, 2, 4, [3.0, 1.2, 1.0]);
    roles[Role.Type.Repairer]   = Operation.createRolePositionObject(Role.Type.Repairer,  0, 1, 2, [1.1, 1.0]);
    roles[Role.Type.Supplier]   = Operation.createRolePositionObject(Role.Type.Supplier,  0, 1, 3, [2.5, 1.0]);
    roles[Role.Type.Upgrader]   = Operation.createRolePositionObject(Role.Type.Upgrader,  0, 0, 2, 1.0);
    return roles;
}

module.exports = Home.prototype;