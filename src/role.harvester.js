var Role = require('roleTypes');
var RoleBase = require('rolePrototype');
var JobFactory = require('jobFactory');
var JobPrototypeSupply = require('job.supply');
var JobPrototypeStore = require('job.store');
var Job = require('jobTypes');

//var HarvesterState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, MoveTo: 2, Harvest: 3, Transfer: 4, Next: 5, Upgrade: 6 });

function Harvester()
{
    //console.log("Harvester.constructor()");
    this.roleName = "Harvester";

    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Harvester);

    this.partWeightMap[WORK] = 1.5;
    this.partWeightMap[CARRY] = 1.0;
    this.partWeightMap[MOVE] = 1.0;
}

/// Prototype

Harvester.prototype = Object.create(RoleBase);
Harvester.prototype.constructor = Harvester;

Harvester.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    var job = getJob(actor);
    if (job != null)
        actor.addJob(job);
}

module.exports = Harvester.prototype;

/// Internal functions

function getJob(actor)
{
    // No energy, go harvest
    if (actor.creep.carry.energy == 0)
        return JobFactory.createFromType(Job.Type.Harvest, { "for": actor.creep.name });

    // Try to find a target for a Store job
    var target = JobPrototypeStore.getStoreTarget(actor);
    if (target != null)
        return JobFactory.createFromType(Job.Type.Store, { "for": actor.creep.name, "target": target });
    else if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to store energy to to!");

    // Try to find a target for a Supply job
    var target = JobPrototypeSupply.getSupplyTarget(actor);
    if (target != null)
        return JobFactory.createFromType(Job.Type.Supply, { "for": actor.creep.name, "target": target });
    else if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to supply energy with!");

    // Get the room's Controller for an Upgrade job
    var controller = actor.creep.room.controller;
    if (controller != null)
        return JobFactory.createFromType(Job.Type.Upgrade, { "for": actor.creep.name });
    else
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

    return null;
}