var Role = require('rolePrototype');
var RoleType = require('roleTypes');
var JobFactory = require('jobFactory');
var JobPrototypeResupply = require('job.resupply');
var JobType = require('jobTypes');

//var UpgraderState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Upgrade: 3 });

/// Constructor

function Upgrader()
{
    //console.log("Upgrader.constructor()");
    this.roleName = "Upgrader";
    
    this.base = Object.create(Role);
    this.base.constructor(this, RoleType.Upgrader);

    this.partWeightMap[WORK] = 2;
    this.partWeightMap[CARRY] = 2;
    this.partWeightMap[MOVE] = 1;
}

/// Prototype

Upgrader.prototype = Object.create(Role);
Upgrader.prototype.constructor = Upgrader;

Upgrader.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    var job = getJob(actor);
    if (job != null)
        actor.addJob(job);
}

module.exports = Upgrader.prototype;

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

    // Get the room's Controller for an Upgrade job
    var controller = actor.creep.room.controller;
    if (controller != null)
        return JobFactory.createFromType(JobType.Upgrade, { "for": actor.creep.name });
    else
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

    return null;
}