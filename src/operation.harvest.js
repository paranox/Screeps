var Operation = require('operationTypes');
var OperationBase = require('operationBase');
var Role = require('roleTypes');
var JobWait = require('job.wait');
var Job = require('jobTypes');

function Harvest(opts)
{
	//console.log("OperationBase->Harvest.constructor(opts: " + JSON.stringify(opts) + ")");
	this.opType = Operation.Type.Harvest;
	this.opName = Operation.getNameOf(this.opType);
	
    this.base = OperationBase;
    this.base.constructor(this, opts);

	if (opts == null)
		return;
	
	if (opts.target instanceof Source)
	{
		this.target = opts.target;
		this.targetPos = opts.target.pos;
	}
	else if (opts.targetPos)
		this.targetPos = opts.targetPos;

    if (typeof opts.dropOff == "string")
        this.dropOff = Game.getObjectById(opts.dropOff);
    else
    	this.dropOff = opts.dropOff;
}

/// Memory functions, should always be called via context's override
/// NOTE: These require a context reference and are usually

Harvest.prototype.getConstructorOptsHelpString = function()
{
    return OperationBase.getConstructorOptsHelpString() + ", target:string_id, targetPos:RoomPosition";
}

Harvest.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (!data)
		return;
	
	if (data.target)
	{
		this.target = Game.getObjectById(data.target);

		if (!this.target)
			console.log("Operation " + this.opName + "[" + this.id + "]: Unable to determine target object by id " + data.target);
	}
	if (data.targetPos)
	{
		this.targetPos = new RoomPosition(data.targetPos.x, data.targetPos.y, data.targetPos.roomName);
	}

    if (typeof data.dropOff == "object")
        this.dropOff = new RoomPosition(data.dropOff.x, data.dropOff.y, data.dropOff.roomName);
    else if (typeof data.dropOff == "string")
    	this.dropOff = Game.getObjectById(data.dropOff);

	return true;
}

Harvest.prototype.writeSaveData = function()
{
	var data = this.base.writeSaveData(this);
	
	if (this.target)
		data.target = this.target.id;
	if (this.targetPos)
		data.targetPos = this.targetPos

    if (this.dropOff instanceof RoomPosition)
        data.dropOff = this.dropOff;
    else if (this.dropOff)
    	data.dropOff = this.dropOff.id;

	return data;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

Harvest.prototype.onUpdate = function()
{
	
}

Harvest.prototype.getJob = function(actor)
{
	if (actor.creep.carry.energy >= actor.creep.carryCapacity)
	{
		//console.log("Operation " + this.opName + ": Actor full of energy!");
		if (this.dropOff instanceof RoomPosition)
		{
			if (Game.rooms[this.dropOff.roomName])
			{
				var storeTarget = null;
				var structures = this.dropOff.lookFor(LOOK_STRUCTURES);
				for (var i = 0; i < structures.length; i++)
				{
					if (structures[i].storeCapacity > 0)
					{
						storeTarget = structures[i];
						break;
					}
				}

				if (storeTarget != null)
				{
					if (this.doDebug)
					{
						console.log("Operation " + this.opName + "[" + this.id + "]: " + actor.creep.name +
							" dropping off at " + storeTarget);
					}

					return Game.empire.factories.job.createFromType(Job.Type.Store, { for:actor.creep.name, target:storeTarget })
				}

				console.log("Operation " + this.opName + "[" + this.id + "]: " + actor.creep.name +
					" couldn't find anything to transfer energy to at dropOff " + this.dropOff);
			}
		}
		else if (this.dropOff instanceof RoomObject)
			return Game.empire.factories.job.createFromType(Job.Type.Store, { for:actor.creep.name, target:this.dropOff });
		else if (this.dropOff)
		{
			console.log("Operation " + this.opName + "[" + this.id + "]: Invalid dropOff property given: " +
				this.dropOff + " of type " + typeof this.dropOff);
		}

		return null;
	}

	if (!this.target)
	{
		if (this.targetPos)
		{
			if (this.targetPos.roomName != actor.creep.room.name)
			{
				console.log("Operation " + this.opName + "[" + this.id + "]: Actor " + actor.creep.name +
					" in wrong room " + actor.creep.room + "!");

				return Game.empire.factories.job.createFromType(Job.Type.MoveTo,
					{ for:actor.creep.name, targetName:this.targetPos.roomName})
			}
			else
			{
				this.target = Game.rooms[this.targetPos.roomName].lookForAt(FIND_SOURCES, this.targetPos);
				if (!this.target)
				{
					console.log("Operation " + this.opName + "[" + this.id + "]: Unable to find Source at " + this.targetPos);
					return null;
				}
			}
		}
		else
		{
			console.log("Operation " + this.opName + "[" + this.id + "]: No target specified!");
			return null;
		}
	}

	if (this.target.energy == 0)
	{
		if (this.doDebug)
			console.log("Operation " + this.opName + "[" + this.id + "]: Target " + this.target + " at " + this.target.pos + " has no energy left!");

		// This is supposed to force a Store type job
		if (actor.creep.carry.energy > 0)
			return null;

		return Game.empire.factories.job.createFromType(Job.Type.Wait,
		{
			for:actor.creep.name,
			target:this.target,
			waitType:JobWait.WaitType.EnergyLevel,
			testType:JobWait.TestType.Greater,
			testValue:0
		});
	}

	return Game.empire.factories.job.createFromType(Job.Type.Harvest, { for:actor.creep.name, target:this.target } );
}

Harvest.prototype.createDefaultRoles = function()
{
	var roles = {};
	roles[Role.Type.Harvester] = Operation.createRolePositionObject(Role.Type.Harvester, 0, 1, 3, [2.5, 1.0]);
	return roles;
}

module.exports = Harvest.prototype;