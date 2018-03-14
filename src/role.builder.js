var Role = require('rolePrototype');
var RoleType = require('roleTypes');

var BuilderState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Build: 3, Upgrade: 4 });

function Builder()
{
    //console.log("Builder.constructor()");
    this.roleName = "Builder";
    
    this.base = Object.create(Role);
    this.base.constructor(this, RoleType.Builder);

    this.partWeightMap[WORK] = 1.0;
    this.partWeightMap[CARRY] = 1.0;
    this.partWeightMap[MOVE] = 1.0;
}

Builder.prototype = Object.create(Role);
Builder.prototype.constructor = Builder;

Builder.prototype.run = function(actor)
{
    const doDebug = false;

    if (!actor.creep.memory.state)
        actor.creep.memory.state = BuilderState.Idle;

    switch (actor.creep.memory.state)
    {
        case BuilderState.Idle:
            if (actor.creep.carry.energy < actor.creep.carryCapacity)
                actor.creep.memory.state = BuilderState.SeekSource;
            else
            {
                actor.creep.memory.state = BuilderState.Build;
                actor.creep.say("█ I'm full!");
            }

            break;
        case BuilderState.SeekSource:
            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);//, { filter: (s) => (s.energy / s.energyCapacity > 0.1) });
            if (source == null)
            {
                console.log(actor.creep.name + ": Can't find a Source!");
                actor.creep.memory.state = BuilderState.Error;
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
                actor.creep.memory.state = BuilderState.Harvest;
                actor.creep.say("☭ Harvest!");
            }

            break;
        case BuilderState.Harvest:
            var source = actor.creep.pos.findClosestByPath(FIND_SOURCES);

            if (source == null)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Can't find a Source!");

                actor.creep.memory.state = BuilderState.Error;
                return;
            }

            if (actor.creep.carry.energy < actor.creep.carryCapacity)
            {
                var status = actor.creep.harvest(source);
                switch (status)
                {
                    case OK:
                        if (doDebug)
                            console.log(actor.creep.name + ": Harvested from Source at " + source.pos.x + "," + source.pos.y);

                        break;
                    case ERR_NOT_IN_RANGE:
                        if (doDebug)
                            console.log(actor.creep.name + ": Moving to Source at " + source.pos.x + "," + source.pos.y);

                        actor.creep.moveTo(source, { visualizePathStyle: { stroke: "#ffaa00" } });
                        actor.creep.memory.state = BuilderState.SeekSource;

                        //actor.creep.say("↻ Move!");

                        break;
                    case ERR_NOT_ENOUGH_RESOURCES:
                        if (doDebug)
                            console.log(actor.creep.name + ": Source out of resources at " + source.pos.x + "," + source.pos.y);
                        break;
                    default:
                        console.log(actor.creep.name + ": Unhandled status (Error code: " + status +
                            ") when trying to harvest Source at " + source.pos.x + "," + source.pos.y);
                        break;
                }
            }
            else
            {
                if (doDebug)
                    console.log(actor.creep.name + ": I'm full!");

                actor.creep.memory.state = BuilderState.Build;
                actor.creep.say("█ I'm full!");
                return;
            }

            break;
        case BuilderState.Build:
            if (actor.creep.carry.energy == 0)
            {
                actor.creep.memory.state = BuilderState.SeekSource;
                return;
            }

            var target = getBuildTarget(actor.creep.room);

            if (target != null)
            {
                if (actor.creep.build(target) == ERR_NOT_IN_RANGE)
                {
                    actor.creep.moveTo(target, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
            else
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Nothing to build!");

                actor.creep.memory.state = BuilderState.Upgrade;
                actor.creep.say("❓ Job done!");
            }
            break;
        case BuilderState.Upgrade:
            if (actor.creep.carry.energy == 0)
            {
                actor.creep.memory.state = BuilderState.SeekSource;
                return;
            }

            var targets = actor.creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length > 0)
            {
                actor.creep.memory.state = BuilderState.Build;
                actor.creep.say("⚒ Work!");
                return;
            }

            var controller = actor.creep.room.controller;
            if (controller == null)
            {
                if (doDebug)
                    console.log(actor.creep.name + ": Can't find Controller!");

                actor.creep.memory.state = BuilderState.Error;
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
            actor.creep.memory.state = BuilderState.Idle;
            actor.creep.say("???");

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