var Role = require('rolePrototype');

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
        creep.memory.state = 0;

    switch (creep.memory.state)
    {
        case 0: // Seeks nearest Source
            if (creep.carry.energy >= creep.carryCapacity)
            {
                creep.memory.state = 3;
                creep.say("█ I'm full!");
                return;
            }

            var source = creep.pos.findClosestByPath(FIND_SOURCES);//, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
            if (source == null)
            {
                console.log(creep.name + ": Can't find a Source!");
                creep.memory.state = -1;
                return;
            }

            var status = creep.harvest(source);
            if (status == ERR_NOT_IN_RANGE)
            {
                if (doDebug)
                    console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                creep.memory.state = 1;
                    
                creep.say("↻ Moving...");
            }
            else
            {
                creep.memory.state = 2;
                creep.say("☭ Harvest!");
            }

            break;
        case 1: // Move to Source
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
                creep.memory.state = 2;
                creep.say("☭ Harvest!");
            }
            else
                creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });

            break;
        case 2: // Harvest Source
            var source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.carry.energy < creep.carryCapacity)
            {
                var status = creep.harvest(source);
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                    creep.memory.state = 1;

                    creep.say("↻ Move!");
                }
                else if (doDebug)
                    console.log(creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
            else
            {
                if (doDebug)
                    console.log(creep.name + ": I'm full!");

                creep.memory.state = 3;
                creep.say("█ I'm full!");
                return;
            }
            break;
        case 3: // Move to target and transfer
            if (creep.carry.energy == 0)
            {
                creep.memory.state = 0;
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
                    creep.memory.state = 4;
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

                creep.moveTo(Game.spawns['Spawn.home']);
            }

            break;
        case 4: // Find new target if not empty yet
            if (creep.carry.energy == 0)
                creep.memory.state = 0;
            else
            {
                creep.say("Next!");
                creep.memory.state = 3;
            }
            break;
        default: // Reset
            creep.memory.state = 0;
            creep.say("???");
            break;
    }
};

module.exports = Harvester.prototype;