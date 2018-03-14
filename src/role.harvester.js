var Role = require('rolePrototype');
var RoleType = require('roleTypes');

var HarvesterState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, MoveTo: 2, Harvest: 3, Transfer: 4, Next: 5, Upgrade: 6 });

function Harvester()
{
    //console.log("Harvester.constructor()");
    this.roleName = "Harvester";

    this.base = Object.create(Role);
    this.base.constructor(this, RoleType.Harvester);

    this.partWeightMap[WORK] = 2.0;
    this.partWeightMap[CARRY] = 1.0;
    this.partWeightMap[MOVE] = 2.0;
}

Harvester.prototype = Object.create(Role);
Harvester.prototype.constructor = Harvester;

Harvester.prototype.run = function(actor)
{
    const doDebug = false;

    if (!actor.creep.memory.state)
        actor.creep.memory.state = HarvesterState.Idle;

    switch (actor.creep.memory.state)
    {
        case HarvesterState.Idle:
            if (actor.creep.carry.energy < actor.creep.carryCapacity)
                actor.creep.memory.state = HarvesterState.SeekSource;
            else
            {
                actor.creep.memory.state = HarvesterState.Harvest;
                actor.creep.say("█ I'm full!");
            }

            break;
        case HarvesterState.SeekSource:
            if (actor.creep.carry.energy >= actor.creep.carryCapacity)
            {
                actor.creep.memory.state = HarvesterState.Transfer;
                actor.creep.say("█ I'm full!");
                return;
            }

            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);//, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
            if (source == null)
            {
                console.log(actor.creep.name + ": Can't find a Source!");
                actor.creep.memory.state = HarvesterState.Error;
                return;
            }

            var status = actor.creep.harvest(source);
            if (status == ERR_NOT_IN_RANGE)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                actor.creep.memory.state = HarvesterState.MoveTo;
                    
                actor.creep.say("↻ Moving...");
            }
            else
            {
                actor.creep.memory.state = HarvesterState.Harvest;
                actor.creep.say("☭ Harvest!");
            }

            break;
        case HarvesterState.MoveTo:
            // TODO: Use a path to check if at target
            /*if (!actor.creep.memory._move)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Refreshing path to Source at " + source.pos.x + "," + source.pos.y);

                var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);
                actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
            }
            else
                actor.creep.moveByPath(actor.creep.memory._move);*/

            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);

            if (actor.creep.harvest(source) == 0)
            {
                actor.creep.memory.state = HarvesterState.Harvest;
                actor.creep.say("☭ Harvest!");
            }
            else
                actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });

            break;
        case HarvesterState.Harvest:
            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);
            if (actor.creep.carry.energy < actor.creep.carryCapacity)
            {
                var status = actor.creep.harvest(source);
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(actor.creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                    actor.creep.memory.state = HarvesterState.MoveTo;

                    actor.creep.say("↻ Move!");
                }
                else if (doDebug)
                    console.log(actor.creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
            else
            {
                if (doDebug)
                    console.log(actor.creep.name + ": I'm full!");

                actor.creep.memory.state = HarvesterState.Transfer;
                actor.creep.say("█ I'm full!");
                return;
            }
            break;
        case HarvesterState.Transfer:
            if (actor.creep.carry.energy == 0)
            {
                actor.creep.memory.state = HarvesterState.SeekSource;
                return;
            }

            var targets = actor.creep.room.find(FIND_STRUCTURES,
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
                var status = actor.creep.transfer(target, RESOURCE_ENERGY);
                if (status == 0)
                {
                    if (doDebug)
                        console.log(actor.creep.name + ": Transferred Energy to " + target + " at " + target.pos.x + "," + target.pos.y);

                    actor.creep.say("⚡ Transfer!");
                    actor.creep.memory.state = HarvesterState.Transfer;
                }
                else
                {
                    if (status == ERR_NOT_IN_RANGE)
                    {
                        if (doDebug)
                            console.log(actor.creep.name + ": Moving to " + target + " at " + target.pos.x + "," + target.pos.y);

                        actor.creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" } });
                        actor.creep.say("↻ Move!");
                    }
                    else if (doDebug)
                    {
                        console.log(actor.creep.name + ": Error code: " + status + ". Unable to transfer Energy to " + target + " at " +
                            target.pos.x + "," + target.pos.y);
                    }
                }
            }
            else
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Nowhere to transfer!");

                actor.creep.memory.state = HarvesterState.Upgrade;
                actor.creep.say("❓ Job done!");
            }

            break;
        case HarvesterState.Next:
            if (actor.creep.carry.energy == 0)
                actor.creep.memory.state = HarvesterState.SeekSource;
            else
            {
                actor.creep.say("Next!");
                actor.creep.memory.state = HarvesterState.MoveTo;
            }
            break;
        case HarvesterState.Upgrade:
            if (actor.creep.carry.energy == 0)
            {
                actor.creep.memory.state = HarvesterState.SeekSource;
                return;
            }

            var targets = actor.creep.room.find(FIND_STRUCTURES,
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
                actor.creep.memory.state = HarvesterState.Harvest;
                actor.creep.say("☭ Harvest!");
                return;
            }

            var controller = actor.creep.room.controller;
            if (controller == null)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Can't find Controller!");

                actor.creep.memory.state = HarvesterState.Error;
                return;
            }

            var status = actor.creep.upgradeController(controller);
            if (status == 0)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Upgraded Controller at " + controller.pos.x + "," + controller.pos.y);
            }
            else
            {
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(actor.creep.name + ": Moving to Controller at " + controller.pos.x + "," + controller.pos.y);

                    actor.creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffaa00' } });
                }
                else if (doDebug)
                    console.log(actor.creep.name + ": Error code: " + status + ". Unable to Upgrade Controller at " + controller.pos.x + "," + controller.pos.y);
            }

            break;
        default: // Reset
            actor.creep.memory.state = HarvesterState.Idle;
            actor.creep.say("???");
            
            break;
    }
};

module.exports = Harvester.prototype;