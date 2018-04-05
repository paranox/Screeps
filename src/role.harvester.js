var BodyPartMap = require('creepBodyPartMap');
var Role = require('roleTypes');
var RoleBase = require('roleBase');
var JobPrototypeSupply = require('job.supply');
var JobPrototypeStore = require('job.store');
var Job = require('jobTypes');

//var HarvesterState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, MoveTo: 2, Harvest: 3, Transfer: 4, Next: 5, Upgrade: 6 });

function Harvester()
{
    //console.log("Harvester.constructor()");
    this.roleName = Role.getNameOf(Role.Type.Harvester);

    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Harvester);

    this.partMap[WORK] = { type:BodyPartMap.Type.Weight, value:1.0 };
    this.partMap[CARRY] = { type:BodyPartMap.Type.Weight, value:1.0 };
    this.partMap[MOVE] = { type:BodyPartMap.Type.PerOtherPart, value:1.0 };
}

/// Prototype

Harvester.prototype = Object.create(RoleBase);
Harvester.prototype.constructor = Harvester;

Harvester.prototype.getJob = function(actor)
{
    // No energy, go harvest
    if (actor.creep.carry.energy == 0)
        return Game.empire.factories.job.createFromType(Job.Type.Harvest, { for:actor.creep.name });

    // Try to find a target for a Store job
    var target = JobPrototypeStore.getStoreTarget(actor);
    if (target != null)
        return Game.empire.factories.job.createFromType(Job.Type.Store, { for:actor.creep.name, target:target });
    else if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to store energy to to!");

    // Try to find a target for a Supply job
    var target = JobPrototypeSupply.getSupplyTarget(actor);
    if (target != null)
        return Game.empire.factories.job.createFromType(Job.Type.Supply, { for:actor.creep.name, target:target });
    else if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to supply energy with!");

    // Get the room's Controller for an Upgrade job
    var controller = actor.creep.room.controller;
    if (controller && controller.my)
        return Game.empire.factories.job.createFromType(Job.Type.Upgrade, { for:actor.creep.name, target:controller });
    else
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

    return null;
}

module.exports = Harvester.prototype;

/// Internal functions