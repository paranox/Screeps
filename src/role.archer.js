var BodyPartMap = require('creepBodyPartMap');
var Role = require('roleTypes');
var RoleBase = require('roleBase');
var Job = require('jobTypes');

function Archer()
{
    //console.log("Archer.constructor()");
    this.roleName = Role.getNameOf(Role.Type.Archer);

    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Archer);

	this.minimumParts = [RANGED_ATTACK, WORK, CARRY, MOVE, MOVE, MOVE];

    this.partMap[RANGED_ATTACK] = { type:BodyPartMap.Type.Weight, value:1.5 };
    this.partMap[TOUGH] = { type:BodyPartMap.Type.Weight, value:1.0 };
    this.partMap[MOVE] = { type:BodyPartMap.Type.PerOtherPart, value:1.0 };
}

/// Prototype

Archer.prototype = Object.create(RoleBase);
Archer.prototype.constructor = Archer;

Archer.prototype.run = function(actor)
{
	if (actor.doDebug)
		console.log("Role->" + this.roleName + ".run(" + actor.creep.name + ")");

    if (this.tryDoJob(actor))
        return;

    var job;
    if (actor.operation != null)
    {
        job = actor.operation.getJob(actor);
        if (job != null)
        {
            actor.addJob(job);
            this.tryDoJob(job);
            return;
        }
        //else
        //    console.log(actor.creep.name + ": Operation " + actor.operation.opName + " had no work, going solo!");
    }

	if (actor.creep.memory.targetRoom && actor.creep.room.name != actor.creep.memory.targetRoom)
	{
		job = Game.empire.factories.job.createFromType(Job.Type.MoveTo, { targetName:actor.creep.memory.targetRoom });
		actor.addJob(job);
		this.tryDoJob(job);
		return;
	}

    var closestHostile = actor.creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

    if (closestHostile)
    {
    	if (actor.creep.pos.getRangeTo(closestHostile) > 3)
    	{
	        if (actor.doDebug)
	        	console.log("Alert! Archer at " + actor.creep.pos + " approaching hostile at " + closestHostile.pos);

    		actor.creep.moveTo(closestHostile);
    	}
    	else
    	{
    		if (actor.doDebug)
	        	console.log("Alert! Archer at " + actor.creep.pos + " attacking hostile at " + closestHostile.pos);

	        actor.creep.rangedAttack(closestHostile);
    	}

    	return;
    }

    var stagingArea = null;
    var flag;
    for (const id in Game.flags)
    {
    	flag = Game.flags[id];
    	if (flag.room.name == actor.creep.room.name && flag.name == "Flag_MilitaryStagingArea")
    	{
    		if (!actor.creep.pos.isNearTo(flag.pos))
    			actor.creep.moveTo(flag);

    		break;
    	}
    }
}

Archer.prototype.getJob = function(actor)
{
	return null;
}

module.exports = Archer.prototype;