var Role = require('roleTypes');
var RoleBase = require('rolePrototype');
var JobFactory = require('jobFactory');
var JobPrototypeBuild = require('job.build');
var JobPrototypeResupply = require('job.resupply');
var Job = require('jobTypes');

//var BuilderState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Build: 3, Upgrade: 4 });

/// Constructor

function Builder()
{
    //console.log("Builder.constructor()");
    this.roleName = "Builder";
    
    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Builder);

    this.partWeightMap[WORK] = 1.0;
    this.partWeightMap[CARRY] = 1.0;
    this.partWeightMap[MOVE] = 1.0;
}

/// Prototype

Builder.prototype = Object.create(RoleBase);
Builder.prototype.constructor = Builder;

Builder.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    var job = getJob(actor);
    if (job != null)
        actor.addJob(job);
}

module.exports = Builder.prototype;

/// Internal functions

function getJob(actor)
{
    // No energy, go get some
    if (actor.creep.carry.energy == 0)
    {
        var target = JobPrototypeResupply.getResupplyTarget(actor);
        if (target != null)
            return JobFactory.createFromType(Job.Type.Resupply, { "for": actor.creep.name, "target": target });

        return JobFactory.createFromType(Job.Type.Harvest, { "for": actor.creep.name });
    }

    // Try to find a target for a Supply job
    var target = JobPrototypeBuild.getBuildTarget(actor.creep.room);
    if (target != null)
        return JobFactory.createFromType(Job.Type.Build, { "for": actor.creep.name, "target": target });
    else if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to build!");

    // Get the room's Controller for an Upgrade job
    var controller = actor.creep.room.controller;
    if (controller != null)
        return JobFactory.createFromType(Job.Type.Upgrade, { "for": actor.creep.name });
    else
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

    return null;
}