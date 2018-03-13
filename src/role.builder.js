var Role = require('rolePrototype');

var BuilderState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Build: 3, Upgrade: 4 });

function Builder()
{
    //console.log("Builder()");
    this.base = Role;
    this.base("Builder");

    this.partWeightMap[WORK] = 1.0;
    this.partWeightMap[CARRY] = 1.0;
    this.partWeightMap[MOVE] = 1.0;

    this.opts = { memory: { role: 'builder' } };
}

Builder.prototype = Object.create(Role);
Builder.prototype.constructor = Builder;

Builder.prototype.run = function(creep)
{
    const doDebug = false;

    if (!creep.memory.state)
        creep.memory.state = BuilderState.Idle;

    switch (creep.memory.state)
    {
        case BuilderState.Idle:
            if (creep.carry.energy < creep.carryCapacity)
                creep.memory.state = BuilderState.SeekSource;
            else
            {
                creep.memory.state = BuilderState.Build;
                creep.say("█ I'm full!");
            }

            break;
        case BuilderState.SeekSource:
            var source = creep.pos.findClosestByPath(FIND_SOURCES);//, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
            if (source == null)
            {
                console.log(creep.name + ": Can't find a Source!");
                creep.memory.state = BuilderState.Error;
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
                creep.memory.state = BuilderState.Harvest;
                creep.say("☭ Harvest!");
            }

            break;
        case BuilderState.Harvest:
            var source = creep.pos.findClosestByPath(FIND_SOURCES);
            if (creep.carry.energy < creep.carryCapacity)
            {
                var status = creep.harvest(source);
                if (status == ERR_NOT_IN_RANGE)
                {
                    if (doDebug)
                        console.log(creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                    creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                    creep.memory.state = BuilderState.SeekSource;

                    //creep.say("↻ Move!");
                }
                else if (doDebug)
                    console.log(creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);
            }
            else
            {
                if (doDebug)
                    console.log(creep.name + ": I'm full!");

                creep.memory.state = BuilderState.Build;
                creep.say("█ I'm full!");
                return;
            }

            break;
        case BuilderState.Build:
            if (creep.carry.energy == 0)
            {
                creep.memory.state = BuilderState.SeekSource;
                return;
            }

            var target = getBuildTarget(creep.room);

            if (target != null)
            {
                if (creep.build(target) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
            else
            {
                if (doDebug)
                    console.log(creep.name + ": Nothing to build!");

                creep.memory.state = BuilderState.Upgrade;
                creep.say("❓ Job done!");
            }
            break;
        case BuilderState.Upgrade:
            if (creep.carry.energy == 0)
            {
                creep.memory.state = BuilderState.SeekSource;
                return;
            }

            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length > 0)
            {
                creep.memory.state = BuilderState.Build;
                creep.say("⚒ Work!");
                return;
            }

            var controller = creep.room.controller;
            if (controller == null)
            {
                if (doDebug)
                    console.log(creep.name + ": Can't find Controller!");

                creep.memory.state = BuilderState.Error;
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
            creep.memory.state = BuilderState.Idle;
            creep.say("???");

            break;
    }
};

function getBuildTarget(room)
{
    var allTarges = room.find(FIND_CONSTRUCTION_SITES);
    var extensions = [];
    var defenses = [];
    var walls = [];
    var others = [];

    var target = null;
    for (var i = 0; i < allTarges.length; i++)
    {
        target = allTarges[i];

        //console.log("Target[" + i + "/" + allTarges.length + "]" + target.structureType +
            //" at " + target.pos + ", progress " + target.progress);

        switch (target.structureType)
        {
            case STRUCTURE_TOWER:
                defenses.push(target);
                break;
            case STRUCTURE_EXTENSION:
                extensions.push(target);
                break;
            case STRUCTURE_WALL:
                walls.push(target);
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

    // TODO: Pick the closest one
    if (targets != null && targets.length > 0)
        target = targets[0];

    return target;
}

module.exports = Builder.prototype;