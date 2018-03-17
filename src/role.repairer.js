var Role = require('rolePrototype');
var RoleType = require('roleTypes');
var JobFactory = require('jobFactory');
var JobPrototypeRepair = require('job.repair');
var JobPrototypeResupply = require('job.resupply');
var JobType = require('jobTypes');

//var RepairerState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Repair: 3, Upgrade: 4 });

/// Constructor

function Repairer()
{
    //console.log("Repairer.constructor()");
    this.roleName = "Repairer";

    this.base = Object.create(Role);
    this.base.constructor(this, RoleType.Repairer);

    this.partWeightMap[WORK] = 1.0;
    this.partWeightMap[CARRY] = 2.0;
    this.partWeightMap[MOVE] = 2.0;
}

/// Prototype

Repairer.prototype = Object.create(Role);
Repairer.prototype.constructor = Repairer;

Repairer.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    var job = getJob(actor);
    if (job != null)
        actor.addJob(job);
}

module.exports = Repairer.prototype;

/// Internal functions

function getJob(actor)
{
    // No energy, go get some
    if (actor.creep.carry.energy == 0)
    {
        var target = JobPrototypeResupply.getResupplyTarget(actor);
        if (target != null)
            return JobFactory.createFromType(JobType.Resupply, { "for": actor.creep.name, "target": target });

        return JobFactory.createFromType(JobType.Harvest, { "for": actor.creep.name });
    }

    // Try to find a target for a Repair job
    var target = JobPrototypeRepair.getRepairTarget(actor.creep.room);
    if (target != null)
        return JobFactory.createFromType(JobType.Repair, { "for": actor.creep.name, "target": target });
    else if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to repair!");

    // Get the room's Controller for an Upgrade job
    var controller = actor.creep.room.controller;
    if (controller != null)
        return JobFactory.createFromType(JobType.Upgrade, { "for": actor.creep.name });
    else
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

    return null;
}