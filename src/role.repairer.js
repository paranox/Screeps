var Role = require('rolePrototype');
var RoleType = require('roleTypes');
var Jobs = require('jobs');
var JobType = require('jobTypes');

var RepairerState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Repair: 3, Upgrade: 4 });

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

/// Internal functions

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
            case STRUCTURE_TOWER:
                if (target.hits / target.hitsMax < 0.95) defenses.push(target);
                break;
            case STRUCTURE_EXTENSION:
                if (target.hits / target.hitsMax < 0.95) extensions.push(target);
                break;
            case STRUCTURE_WALL:
                if (target.hits / target.hitsMax < 0.75) walls.push(target);
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
};

/// Prototype

Repairer.prototype = Object.create(Role);
Repairer.prototype.constructor = Repairer;

Repairer.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    // No energy, go harvest
    if (actor.creep.carry.energy == 0)
    {
        console.log(actor.creep.name + ": Need to harvest!");
        actor.setState(RepairerState.Harvest);

        let job = Jobs.createFromType(JobType.Harvest);
        if (job != null)
            actor.addJob(job);
        else
            console.log(actor.creep.name + ": Error creating Harvest job!");
        
        return;
    }

    // Try to find repair target
    var target = getRepairTarget(actor.creep.room);

    if (target != null)
    {
        actor.setState(RepairerState.Repair);
        let job = Jobs.createFromType(JobType.RepairTarget, { "target": target });

        if (job != null)
            actor.addJob(job);
        else
            console.log(actor.creep.name + ": Error creating Repair job!");

        return;
    }

    if (actor.doDebug)
        console.log(actor.creep.name + ": Nothing to repair!");

    actor.setState(RepairerState.Upgrade);

    this.runOld(actor);
};

Repairer.prototype.end = function(actor)
{

};

Repairer.prototype.runOld = function(actor)
{
    if (actor.doDebug)
        console.log(actor.creep.name + ": Running legacy role work!");

    switch (actor.state)
    {
        case RepairerState.Idle:
            if (actor.creep.carry.energy < actor.creep.carryCapacity)
                actor.state = RepairerState.SeekSource;
            else
            {
                actor.state = RepairerState.Repair;
                actor.creep.say("█ I'm full!");
            }

            break;
        case RepairerState.SeekSource:
            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);//, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
            if (source == null)
            {
                console.log(actor.creep.name + ": Can't find a Source!");
                actor.state = RepairerState.Error;
                return;
            }

            var status = actor.creep.harvest(source);
            if (status == ERR_NOT_IN_RANGE)
            {
                if (actor.doDebug)
                    console.log(actor.creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                //actor.creep.say("↻ Move!");
            }
            else
            {
                actor.state = RepairerState.Harvest;
                actor.creep.say("☭ Harvest!");
            }

            break;
        case RepairerState.Harvest:
            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);

            if (source == null)
            {
                console.log(actor.creep.name + ": Can't find a Source!");
                actor.state = RepairerState.Error;
                return;
            }

            if (actor.creep.carry.energy < actor.creep.carryCapacity)
            {
                var status = actor.creep.harvest(source);
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (actor.doDebug)
                        console.log(actor.creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                    actor.state = RepairerState.SeekSource;

                    //creep.say("↻ Move!");
                }
                else if (actor.doDebug)
                    console.log(actor.creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
            else
            {
                if (actor.doDebug)
                    console.log(actor.creep.name + ": I'm full!");

                actor.state = RepairerState.Repair;
                actor.creep.say("█ I'm full!");
                return;
            }

            break;
        case RepairerState.Repair:
            if (actor.creep.carry.energy == 0)
            {
                actor.state = RepairerState.SeekSource;
                return;
            }
            break;
        case RepairerState.Upgrade:
            if (actor.creep.carry.energy == 0)
            {
                actor.state = RepairerState.SeekSource;
                return;
            }

            var targets = actor.creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length > 0)
            {
                actor.state = RepairerState.Repair;
                actor.creep.say("⚒ Work!");
                return;
            }

            var controller = actor.creep.room.controller;
            if (controller == null)
            {
                if (actor.doDebug)
                    console.log(actor.creep.name + ": Can't find Controller!");

                actor.state = RepairerState.Error;
                return;
            }

            var status = actor.creep.upgradeController(controller);
            if (status == 0)
            {
                if (actor.doDebug)
                    console.log(actor.creep.name + ": Upgraded Controller at " + controller.pos.x + "," + controller.pos.y);
            }
            else
            {
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (actor.doDebug)
                        console.log(actor.creep.name + ": Moving to Controller at " + controller.pos.x + "," + controller.pos.y);

                    actor.creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                else if (actor.doDebug)
                    console.log(actor.creep.name + ": Error code: " + status + ". Unable to Upgrade Controller at " + controller.pos.x + "," + controller.pos.y);
            }

            break;
        default: // Reset
            actor.state = RepairerState.Idle;
            actor.creep.say("???");

            break;
    }
};

module.exports = Repairer.prototype;