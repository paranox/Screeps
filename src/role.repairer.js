var Role = require('rolePrototype');
var RoleType = require('roleTypes');
var JobFactory = require('jobFactory');
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
    // No energy, go harvest
    if (actor.creep.carry.energy == 0)
        return JobFactory.createFromType(JobType.Harvest, { "for": actor.creep.name });

    // Try to find a target for a Repair job
    var target = getRepairTarget(actor.creep.room);
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

function getRepairTarget(room)
{
    var allTarges = room.find(FIND_STRUCTURES, { filter: (s) => s.hits != undefined && s.hitsMax != undefined });
    var defenses = [];
    var walls = [];
    var extensions = [];
    var others = [];

    var target = null;
    for (var i = 0; i < allTarges.length; i++)
    {
        target = allTarges[i];

        //console.log("Target[" + i + "/" + allTarges.length + "]" + target.structureType +
            //" at " + target.pos + ", hits: " + target.hits + "/" + target.hitsMax);

        switch (target.structureType)
        {
            case STRUCTURE_RAMPART:
            case STRUCTURE_TOWER:
                if (target.hits / target.hitsMax < 0.95) defenses.push(target);
                break;
            case STRUCTURE_EXTENSION:
                if (target.hits / target.hitsMax < 0.95) extensions.push(target);
                break;
            case STRUCTURE_WALL:
                if (target.hits / target.hitsMax < 0.25) walls.push(target);
                break;
            case STRUCTURE_ROAD:
                if (target.hits / target.hitsMax < 0.5) others.push(target);
                break;
            default:
                others.push(target);
                break;
        }
    }

    var targets = null;
    if (defenses.length > 0)
        targets = defenses;
    else if (extensions.length > 0)
        targets = extensions;
    else if (walls.length > 0)
        targets = walls;
    else
        targets = others;

    var index = 0;
    var hitsRatio = 1.0;
    var lowestHitsRatio = Number.MAX_VALUE;
    for (var t = 0; t < targets.length; t++)
    {
        target = targets[t];
        hitsRatio = target.hits / target.hitsMax;
        if (hitsRatio < lowestHitsRatio)
        {
            index = t;
            lowestHitsRatio = hitsRatio;
        }
    }

    if (targets != null && targets.length > 0)
        target = targets[index];

    return target;
}