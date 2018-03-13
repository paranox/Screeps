var Role = require('rolePrototype');

var HarvesterState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, MoveTo: 2, Harvest: 3, Transfer: 4, Next: 5, Upgrade: 6 });

function Harvester()
{
    //console.log("Harvester()");
    this.base = Role;
    this.base("Harvester");

    this.partWeightMap[WORK] = 2.0;
    this.partWeightMap[CARRY] = 1.0;
    this.partWeightMap[MOVE] = 2.0;

    this.opts = { memory: { role: 'harvester' } };
}

Harvester.prototype = Object.create(Role);
Harvester.prototype.constructor = Harvester;

Harvester.prototype.run = function(creep)
{
    const doDebug = false;

    if (!creep.memory.state)
        creep.memory.state = HarvesterState.Idle;

    switch (creep.memory.state)
    {
        case HarvesterState.Idle:
            if (creep.carry.energy < creep.carryCapacity)
                creep.memory.state = HarvesterState.SeekSource;
            else
            {
                creep.memory.state = HarvesterState.Harvest;
                creep.say("█ I'm full!");
            }

            break;
        case HarvesterState.SeekSource:
            if (creep.carry.energy >= creep.carryCapacity)
            {
                creep.memory.state = HarvesterState.Transfer;
                creep.say("█ I'm full!");
                return;
            }

            var source = creep.pos.findClosestByPath(FIND_SOURCES);//, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
            if (source == null)
            {
                console.log(creep.name + ": Can't find a Source!");
                creep.memory.state = HarvesterState.Error;
                return;
            }

            var status = creep.harvest(source);
            if (status == ERR_NOT_IN_RANGE)
            {
                if (doDebug)
                    console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                creep.memory.state = HarvesterState.MoveTo;
                    
                creep.say("↻ Moving...");
            }
            else
            {
                creep.memory.state = HarvesterState.Harvest;
                creep.say("☭ Harvest!");
            }

            break;
        case HarvesterState.MoveTo:
            // TODO: Use a path to check if at target
            /*if (!creep.memory._move)
            {
                if (doDebug)
                    console.log(creep.name + ": Refreshing path to Source at " + source.pos.x + "," + source.pos.y);

                var source = creep.pos.findClosestByPath(FIND_SOURCES);
                creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
            else
                creep.moveByPath(creep.memory._move);*/

            var source = creep.pos.findClosestByPath(FIND_SOURCES);

            if (creep.harvest(source) == 0)
            {
                creep.memory.state = HarvesterState.Harvest;
                creep.say("☭ Harvest!");
            }
            else
                creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });

            break;
        case HarvesterState.Harvest:
            var source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.carry.energy < creep.carryCapacity)
            {
                var status = creep.harvest(source);
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                    creep.memory.state = HarvesterState.MoveTo;

                    creep.say("↻ Move!");
                }
                else if (doDebug)
                    console.log(creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
            else
            {
                if (doDebug)
                    console.log(creep.name + ": I'm full!");

                creep.memory.state = HarvesterState.Transfer;
                creep.say("█ I'm full!");
                return;
            }
            break;
        case HarvesterState.Transfer:
            if (creep.carry.energy == 0)
            {
                creep.memory.state = HarvesterState.SeekSource;
                return;
            }

            var targets = creep.room.find(FIND_STRUCTURES,
            {
                filter: (structure) =>
                {
                    return structure.energy < structure.energyCapacity &&
                        (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER);
                }
            });

            if (targets.length > 0)
            {
                var target = targets[0];
                var status = creep.transfer(target, RESOURCE_ENERGY);
                if (status == 0)
                {
                    if (doDebug)
                        console.log(creep.name + ": Transferred Energy to " + target + " at " + target.pos.x + "," + target.pos.y);

                    creep.say("⚡ Transfer!");
                    creep.memory.state = HarvesterState.Transfer;
                }
                else
                {
                    if (status == ERR_NOT_IN_RANGE)
                    {
                        if (doDebug)
                            console.log(creep.name + ": Moving to " + target + " at " + target.pos.x + "," + target.pos.y);

                        creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
                        creep.say("↻ Move!");
                    }
                    else if (doDebug)
                    {
                        console.log(creep.name + ": Error code: " + status + ". Unable to transfer Energy to " + target + " at " +
                            target.pos.x + "," + target.pos.y);
                    }
                }
            }
            else
            {
                if (doDebug)
                    console.log(creep.name + ": Nowhere to transfer!");

                creep.memory.state = HarvesterState.Upgrade;
                creep.say("❓ Job done!");
            }

            break;
        case HarvesterState.Next:
            if (creep.carry.energy == 0)
                creep.memory.state = HarvesterState.SeekSource;
            else
            {
                creep.say("Next!");
                creep.memory.state = HarvesterState.MoveTo;
            }
            break;
        case HarvesterState.Upgrade:
            if (creep.carry.energy == 0)
            {
                creep.memory.state = HarvesterState.SeekSource;
                return;
            }

            var targets = creep.room.find(FIND_STRUCTURES,
            {
                filter: (structure) =>
                {
                    return structure.energy < structure.energyCapacity &&
                        (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER);
                }
            });

            if (targets.length > 0)
            {
                creep.memory.state = HarvesterState.Harvest;
                creep.say("☭ Harvest!");
                return;
            }

            var controller = creep.room.controller;
            if (controller == null)
            {
                if (doDebug)
                    console.log(creep.name + ": Can't find Controller!");

                creep.memory.state = HarvesterState.Error;
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
            creep.memory.state = HarvesterState.Idle;
            creep.say("???");
            
            break;
    }
};

module.exports = Harvester.prototype;