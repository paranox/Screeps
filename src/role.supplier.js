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

        if (job.jobType != Job.Type.Supply && job.jobType != Job.Type.Resupply)
        {
            // Every 10 ticks, check for Supply targets
            if (job.startTime < Game.time && (Game.time - job.startTime) % 10 == 0)
            {
                //console.log(actor.creep.name + ": Working on " + job.jobType +
                //  "(" + Job.getNameOf(job.jobType) + "), checking for supply targets..");

                // Try to find a target for a Supply job
                var target = JobPrototypeSupply.getSupplyTarget(actor);
                if (target != null)
                {
                    console.log(actor.creep.name + ": Interrupting job " + job.jobType + "(" + Job.getNameOf(job.jobType) + "), found supply target " +
                        target.structureType + " at " + target.pos);

                    job.finish(actor, false);

                    // No energy, go resupply
                    if (actor.creep.carry.energy == 0)
                        job = JobFactory.createFromType(Job.Type.Resupply, { "for": actor.creep.name });
                    else
                        job = JobFactory.createFromType(Job.Type.Supply, { "for": actor.creep.name, "target": target });

                    actor.addJob(job);
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
    var room = actor.creep.room;

    if (actor.creep.carry.energy > 0)
    {
        // Try to find a target for a Supply job, favoring everything except storage
        var typeFilter = {};
        typeFilter[STRUCTURE_STORAGE] = false;
        typeFilter[STRUCTURE_CONTAINER] = false;
        var target = JobPrototypeSupply.getSupplyTarget(actor, typeFilter);

        // If nothing found, then pick the storage if there's room
        if (target == null)
        {
            if (room.storage != null)
            {
                if (room.storage.store[RESOURCE_ENERGY] < room.storage.storeCapacity)
                {
                    if (actor.doDebug)
                        console.log(actor.creep.name + ": Supplying storage!");
                    
                    target = room.storage;   
                }
            }
            else if (actor.doDebug)
                console.log(actor.creep.name + ": No storage found to supply!");
        }
        else if (actor.doDebug)
            console.log(actor.creep.name + ": Picked supply target " + target);

        if (target != null)
            return JobFactory.createFromType(Job.Type.Supply, { "for": actor.creep.name, "target": target });
        else if (actor.doDebug)
            console.log(actor.creep.name + ": Nothing to supply energy with!");
    }

    if (actor.creep.carry.energy < actor.creep.carryCapacity)// == 0)
    {
        // Try to find a target for Resupply job, but don't allow taking from storage only to supply back in storage
        var typeFilter = {};
        typeFilter[STRUCTURE_STORAGE] = false;
        var target = JobPrototypeResupply.getResupplyTarget(actor, typeFilter);

        // If nothing else to supply from, check the storage
        if (target == null)
        {
            if (room.storage != null)
            {
                if (room.storage.store[RESOURCE_ENERGY] > 0)
                {
                    if (actor.doDebug)
                        console.log(actor.creep.name + ": Resupplying from storage!");

                    target = room.storage;   
                }
            }
            else if (actor.doDebug)
                console.log(actor.creep.name + ": No storage found to resupply from!");
        }
        else if (actor.doDebug)
            console.log(actor.creep.name + ": Picked resupply target " + target);

        if (target != null)
            return JobFactory.createFromType(Job.Type.Resupply, { "for": actor.creep.name, "target": target });
        else if (actor.doDebug)
            console.log(actor.creep.name + ": Nothing to resupply energy from!");

        return JobFactory.createFromType(Job.Type.Harvest, { "for": actor.creep.name });
    }

    // Get the room's Controller for an Upgrade job
    var controller = room.controller;
    if (controller != null)
        return JobFactory.createFromType(Job.Type.Upgrade, { "for": actor.creep.name });
    else
        console.log(actor.creep.name + ": Can't find Controller in room " + room + "!");

    return null;
}