var Role = require('rolePrototype');

var RepairerState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Repair: 3, Upgrade: 4 });

function Repairer()
{
    //console.log("Repairer()");
    this.base = Role;
    this.base("Repairer");

    this.partWeightMap[WORK] = 1.0;
    this.partWeightMap[CARRY] = 2.0;
    this.partWeightMap[MOVE] = 2.0;

    this.opts = { memory: { role: 'repairer' } };
}

Repairer.prototype = Object.create(Role);
Repairer.prototype.constructor = Repairer;

Repairer.prototype.run = function(creep)
{
    const doDebug = true;

    if (!creep.memory.state)
    {
        if (doDebug)
            console.log("Initializing creep " + creep.name + " memory");

        creep.memory.state = RepairerState.Idle;
    }

    switch (creep.memory.state)
    {
        case RepairerState.Idle:
            if (creep.carry.energy < creep.carryCapacity)
                creep.memory.state = RepairerState.SeekSource;
            else
            {
                creep.memory.state = RepairerState.Repair;
                creep.say("█ I'm full!");
            }

            break;
        case RepairerState.SeekSource:
            var source = creep.pos.findClosestByPath(FIND_SOURCES);//, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
            if (source == null)
            {
                console.log(creep.name + ": Can't find a Source!");
                creep.memory.state = RepairerState.Error;
                return;
            }

            var status = creep.harvest(source);
            if (status == ERR_NOT_IN_RANGE)
            {
                if (doDebug)
                    console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                //creep.say("↻ Move!");
            }
            else
            {
                creep.memory.state = RepairerState.Harvest;
                creep.say("☭ Harvest!");
            }

            break;
        case RepairerState.Harvest:
            var source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.carry.energy < creep.carryCapacity)
            {
                var status = creep.harvest(source);
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                    creep.memory.state = RepairerState.SeekSource;

                    //creep.say("↻ Move!");
                }
                else if (doDebug)
                    console.log(creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
            else
            {
                if (doDebug)
                    console.log(creep.name + ": I'm full!");

                creep.memory.state = RepairerState.Repair;
                creep.say("█ I'm full!");
                return;
            }

            break;
        case RepairerState.Repair:
            if (creep.carry.energy == 0)
            {
                creep.memory.state = RepairerState.SeekSource;
                return;
            }

            var target = getRepairTarget(creep.room);

            if (target != null)
            {
                if (creep.repair(target) == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(creep.name + ": Moving to repair target at " + target.pos.x + "," + target.pos.y);

                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
            else
            {
                if (doDebug)
                    console.log(creep.name + ": Nothing to repair!");

                creep.memory.state = RepairerState.Upgrade;
                creep.say("❓ Job done!");
            }
            break;
        case RepairerState.Upgrade:
            if (creep.carry.energy == 0)
            {
                creep.memory.state = RepairerState.SeekSource;
                return;
            }

            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length > 0)
            {
                creep.memory.state = RepairerState.Repair;
                creep.say("⚒ Work!");
                return;
            }

            var controller = creep.room.controller;
            if (controller == null)
            {
                if (doDebug)
                    console.log(creep.name + ": Can't find Controller!");

                creep.memory.state = RepairerState.Error;
                return;
            }

            var status = creep.upgradeController(controller);
            if (status == 0)
            {
                if (doDebug)
                    console.log(creep.name + ": Upgraded Controller at " + controller.pos.x + "," + controller.pos.y);
            }
            else
            {
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(creep.name + ": Moving to Controller at " + controller.pos.x + "," + controller.pos.y);

                    creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                else if (doDebug)
                    console.log(creep.name + ": Error code: " + status + ". Unable to Upgrade Controller at " + controller.pos.x + "," + controller.pos.y);
            }

            break;
        default: // Reset
            creep.memory.state = RepairerState.Idle;
            creep.say("???");

            break;
    }
};

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
    /*var hitsRatio = 1.0;
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
    }*/

    if (targets != null && targets.length > 0)
        target = targets[index];

    return target;
}

module.exports = Repairer.prototype;