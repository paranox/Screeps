var Role = require('rolePrototype');
var RoleType = require('roleTypes');

var UpgraderState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Upgrade: 3 });

function Upgrader()
{
    //console.log("Upgrader.constructor()");
    this.roleName = "Upgrader";
    
    this.base = Object.create(Role);
    this.base.constructor(this, RoleType.Upgrader);

    this.partWeightMap[WORK] = 2;
    this.partWeightMap[CARRY] = 2;
    this.partWeightMap[MOVE] = 1;
}

Upgrader.prototype = Object.create(Role);
Upgrader.prototype.constructor = Upgrader;

Upgrader.prototype.run = function(actor)
{
    const doDebug = false;

    if (!actor.creep.memory.state)
        actor.creep.memory.state = UpgraderState.Idle;

    switch (actor.creep.memory.state)
    {
        case UpgraderState.Idle:
            if (actor.creep.carry.energy < actor.creep.carryCapacity)
                actor.creep.memory.state = UpgraderState.SeekSource;
            else
            {
                actor.creep.memory.state = UpgraderState.Upgrade;
                actor.creep.say("█ I'm full!");
            }

            break;
        case UpgraderState.SeekSource:
            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES, { filter: (s) => (s.energy > 0) });
            if (source == null)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Can't find a viable Source!");

                actor.creep.memory.state = UpgraderState.Error;
                return;
            }

            var status = actor.creep.harvest(source);
            if (status == ERR_NOT_IN_RANGE)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                //actor.creep.say("↻ Move!");
            }
            else
            {
                actor.creep.memory.state = UpgraderState.Harvest;
                actor.creep.say("☭ Harvest!");
            }

            break;
        case UpgraderState.Harvest:
            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);
            if (actor.creep.carry.energy < actor.creep.carryCapacity)
            {
                var status = actor.creep.harvest(source);
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(actor.creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                    actor.creep.memory.state = UpgraderState.SeekSource;

                    actor.creep.say("↻ Move!");
                }
                else if (doDebug)
                    console.log(actor.creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
            else
            {
                if (doDebug)
                    console.log(actor.creep.name + ": I'm full!");

                actor.creep.memory.state = UpgraderState.Upgrade;
                actor.creep.say("█ I'm full!");
                return;
            }

            break;
        case UpgraderState.Upgrade:
            if (actor.creep.carry.energy == 0)
            {
                actor.creep.memory.state = UpgraderState.SeekSource;
                return;
            }

            var controller = actor.creep.room.controller;
            if (controller == null)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Can't find Controller!");

                actor.creep.memory.state = UpgraderState.Error;
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
            actor.creep.memory.state = UpgraderState.Idle;
            actor.creep.say("???");

            break;
    }
};

module.exports = Upgrader.prototype;