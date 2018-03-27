var Role = require('roleTypes');
var RoleBase = require('rolePrototype');
var JobFactory = require('jobFactory');
var JobPrototypeRepair = require('job.repair');
var JobPrototypeResupply = require('job.resupply');
var Job = require('jobTypes');

//var RepairerState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Repair: 3, Upgrade: 4 });

/// Constructor

function Repairer()
{
    //console.log("Repairer.constructor()");
    this.roleName = "Repairer";

    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Repairer);

    this.partWeightMap[WORK] = 1.0;
    this.partWeightMap[CARRY] = 2.0;
    this.partWeightMap[MOVE] = 2.5;
}

/// Prototype

Repairer.prototype = Object.create(RoleBase);
Repairer.prototype.constructor = Repairer;

Repairer.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    var job = getJob(actor);
    if (job != null)
        actor.addJob(job);
}

Repairer.prototype.tryDoJob = function(actor)
{
    if (actor.currentJob != undefined && actor.currentJob >= 0 && actor.currentJob < actor.jobs.length)
    {
        var job = actor.jobs[actor.currentJob];
        if (job.hasStarted == false)
            job.start(actor);

        if (job.jobType != Job.Type.Repair && job.jobType != Job.Type.Resupply)
        {
            // Every 10 ticks, check for repair targets
            if (job.startTime < Game.time && (Game.time - job.startTime) % 10 == 0)
            {
                //console.log(actor.creep.name + ": Working on " + job.jobType +
                //  "(" + Job.getNameOf(job.jobType) + "), checking for repair targets..");

                // Try to find a target for a Repair job
                var target = JobPrototypeRepair.getRepairTarget(actor.creep.room, actor);
                if (target != null)
                {
                    console.log(actor.creep.name + ": Interrupting job " + job.jobType + "(" + Job.getNameOf(job.jobType) + "), found repair target " +
                        target.structureType + " at " + target.pos);

                    job.finish(actor, false);

                    // No energy, go resupply
                    if (actor.creep.carry.energy == 0)
                        job = JobFactory.createFromType(Job.Type.Resupply, { "for": actor.creep.name });
                    else
                        job = JobFactory.createFromType(Job.Type.Repair, { "for": actor.creep.name, "target": target });

                    if (job != null)
                        actor.addJob(job);
                }
            }
        }

        job.update(actor);
        return true;
    }

    return false;
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
            return JobFactory.createFromType(Job.Type.Resupply, { "for": actor.creep.name, "target": target });

        return JobFactory.createFromType(Job.Type.Harvest, { "for": actor.creep.name });
    }

    // Try to find a target for a Repair job
    var target = JobPrototypeRepair.getRepairTarget(actor.creep.room, actor);
    if (target != null)
        return JobFactory.createFromType(Job.Type.Repair, { "for": actor.creep.name, "target": target });
    else if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to repair!");

    // Get the room's Controller for an Upgrade job
    var controller = actor.creep.room.controller;
    if (controller != null)
        return JobFactory.createFromType(Job.Type.Upgrade, { "for": actor.creep.name });
    else
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

    return null;
}