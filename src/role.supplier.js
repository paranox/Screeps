var Role = require('roleTypes');
var RoleBase = require('rolePrototype');
var JobFactory = require('jobFactory');
var JobPrototypeSupply = require('job.supply');
var JobPrototypeStore = require('job.store');
var JobPrototypeResupply = require('job.resupply');
var Job = require('jobTypes');

function Supplier()
{
    //console.log("Supplier.constructor()");
    this.roleName = "Supplier";

    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Supplier);

    this.partWeightMap[WORK] = 1.0;
    this.partWeightMap[CARRY] = 6.0;
    this.partWeightMap[MOVE] = 6.5;
}

/// Prototype

Supplier.prototype = Object.create(RoleBase);
Supplier.prototype.constructor = Supplier;

Supplier.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    var job = getJob(actor);
    if (job != null)
        actor.addJob(job);
}

Supplier.prototype.tryDoJob = function(actor)
{
    if (actor.currentJob != undefined && actor.currentJob >= 0 && actor.currentJob < actor.jobs.length)
    {
        var job = actor.jobs[actor.currentJob];
        if (job.hasStarted == false)
            job.start(actor);

        if (job.jobType != Job.Type.Supply)
        {
            // Every 10 ticks, check for Supply targets
            if (job.startTime > Game.time && (Game.time - job.startTime) % 10 == 0)
            {
                // Try to find a target for a Supply job
                var target = JobPrototypeSupply.getSupplyTarget(actor);
                if (target != null)
                {
                    console.log(actor.creep.name + ": Interrupting job " + job.jobType + ", found supply target " +
                        target.structureType + " at " + target.pos);

                    // No energy, go resupply
                    if (actor.creep.carry.energy == 0)
                        job = JobFactory.createFromType(Job.Type.Resupply, { "for": actor.creep.name });
                    else
                        job = JobFactory.createFromType(Job.Type.Supply, { "for": actor.creep.name, "target": target });

                    job.start(actor);
                }
            }
        }

        job.update(actor);
        return true;
    }

    return false;
}

module.exports = Supplier.prototype;

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