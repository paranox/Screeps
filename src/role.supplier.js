var Role = require('rolePrototype');
var RoleType = require('roleTypes');
var JobFactory = require('jobFactory');
var JobPrototypeSupply = require('job.supply');
var JobPrototypeStore = require('job.store');
var JobPrototypeResupply = require('job.resupply');
var JobType = require('jobTypes');

function Supplier()
{
    //console.log("Supplier.constructor()");
    this.roleName = "Supplier";

    this.base = Object.create(Role);
    this.base.constructor(this, RoleType.Supplier);

    this.partWeightMap[WORK] = 1.0;
    this.partWeightMap[CARRY] = 2.0;
    this.partWeightMap[MOVE] = 2.0;
}

/// Prototype

Supplier.prototype = Object.create(Role);
Supplier.prototype.constructor = Supplier;

Supplier.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    var job = getJob(actor);
    if (job != null)
        actor.addJob(job);
}

module.exports = Supplier.prototype;

/// Internal functions

function getJob(actor)
{
    // Try to find a target for a Supply job
    var target = JobPrototypeSupply.getSupplyTarget(actor);
    if (target != null)
    {
        // No energy, go resupply
        if (actor.creep.carry.energy == 0)
            return JobFactory.createFromType(JobType.Resupply, { "for": actor.creep.name });

        return JobFactory.createFromType(JobType.Supply, { "for": actor.creep.name, "target": target });
    }

    if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to supply energy with!");
    
    // No energy, go get some
    if (actor.creep.carry.energy == 0)
    {
        var target = JobPrototypeResupply.getResupplyTarget(actor);
        if (target != null)
            return JobFactory.createFromType(JobType.Resupply, { "for": actor.creep.name, "target": target });

        return JobFactory.createFromType(JobType.Harvest, { "for": actor.creep.name });
    }

    // Try to find a target for a Store job
    var target = JobPrototypeStore.getStoreTarget(actor);
    if (target != null)
        return JobFactory.createFromType(JobType.Store, { "for": actor.creep.name, "target": target });
    else if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to store energy to to!");

    return null;
}