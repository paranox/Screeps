var UpgraderState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Upgrade: 3 });
var Speak = Object.freeze({});

var roleUpgrader =
{
    /** @param {Creep} creep **/
    run: function(creep)
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
                var source = creep.pos.findClosestByPath(FIND_SOURCES);//, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
                if (source == null)
                {
                    console.log(creep.name + ": Can't find a Source!");
                    creep.memory.state = UpgraderState.Error;
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
        }

        /*if (creep.carry.energy == 0)
        {
            var source = creep.pos.findClosestByPath(FIND_SOURCES, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
            if (source == null)
            {
                if (doDebug)
                    console.log(creep.name + ": Can't find a Source!");
            }
            else
            {
                if (creep.harvest(source) == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } } );
                    //creep.say('☭ Harvesting...');
                }
                else if (doDebug)
                    console.log(creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
        }
        else
        {
            var controller = creep.room.controller;
            if (controller == null)
            {
                if (doDebug)
                    console.log(creep.name + ": Can't find Controller!");
            }
            else
            {
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
            }
        }*/
    }
}

module.exports = roleUpgrader;