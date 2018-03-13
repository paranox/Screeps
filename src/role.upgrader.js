var Role = require('rolePrototype');

var UpgraderState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Upgrade: 3 });

function Upgrader()
{
    //console.log("Upgrader()");
    this.base = Role;
    this.base("Upgrader");

    this.partWeightMap[WORK] = 2;
    this.partWeightMap[CARRY] = 2;
    this.partWeightMap[MOVE] = 1;

    this.opts = { memory: { role: 'upgrader' } };
}

Upgrader.prototype = Object.create(Role);
Upgrader.prototype.constructor = Upgrader;

Upgrader.prototype.run = function(creep)
{
    const doDebug = false;

    if (!creep.memory.state)
        creep.memory.state = UpgraderState.Idle;

    switch (creep.memory.state)
    {
        case UpgraderState.Idle:
            if (creep.carry.energy < creep.carryCapacity)
                creep.memory.state = UpgraderState.SeekSource;
            else
            {
                creep.memory.state = UpgraderState.Upgrade;
                creep.say("█ I'm full!");
            }

            break;
        case UpgraderState.SeekSource:
            var source = creep.pos.findClosestByPath(FIND_SOURCES, { filter: (s) => (s.energy > 0) });
            if (source == null)
            {
                console.log(creep.name + ": Can't find a viable Source!");
                //creep.memory.state = UpgraderState.Error;
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
                creep.memory.state = UpgraderState.Harvest;
                creep.say("☭ Harvest!");
            }

            break;
        case UpgraderState.Harvest:
            var source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.carry.energy < creep.carryCapacity)
            {
                var status = creep.harvest(source);
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                    creep.memory.state = UpgraderState.SeekSource;

                    creep.say("↻ Move!");
                }
                else if (doDebug)
                    console.log(creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
            else
            {
                if (doDebug)
                    console.log(creep.name + ": I'm full!");

                creep.memory.state = UpgraderState.Upgrade;
                creep.say("█ I'm full!");
                return;
            }

            break;
        case UpgraderState.Upgrade:
            if (creep.carry.energy == 0)
            {
                creep.memory.state = UpgraderState.SeekSource;
                return;
            }

            var controller = creep.room.controller;
            if (controller == null)
            {
                if (doDebug)
                    console.log(creep.name + ": Can't find Controller!");

                creep.memory.state = UpgraderState.Error;
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
            creep.memory.state = UpgraderState.Idle;
            creep.say("???");

            break;
    }
};

module.exports = Upgrader.prototype;