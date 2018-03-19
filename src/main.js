var Utils = require('utils');
var Actor = require('actor');
var RoleFactory = require('roleFactory');
var RoleType = require('roleTypes');
var CreepFactory = require('creepFactory');

module.exports.loop = function ()
{
    RoleFactory.initPrototypes();

    for (var name in Memory.creeps)
    {
        if (!Game.creeps[name])
        {
            delete Memory.creeps[name];
            console.log('Removed non-existing creep from memory: ' + name);
            continue;
        }
    }

    var actor;
    var actors = [];
    for (var name in Game.creeps)
    {
        actor = Object.create(Actor);
        actor.constructor(Game.creeps[name]);
        actors.push(actor);
    }

    //console.log("Created " + actors.length + " Actor objects");

    var tower = Game.getObjectById('d2bb057b6a343c5');
    if (tower != null)
    {
        /*var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, 
            { filter: (structure) => structure.hits < structure.hitsMax });

        if (closestDamagedStructure != null)
            tower.repair(closestDamagedStructure);*/

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if (closestHostile != null)
            tower.attack(closestHostile);
    }

    var bodyPartCount = 0;

    var allHarvesters = [];//_.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var allUpgraders = [];
    var allBuilders = [];
    var allRepairers = [];
    var allSuppliers = [];

    //console.log("Actor phase init!");

    for (var i = 0; i < actors.length; i++)
    {
        actor = actors[i];
        bodyPartCount += actor.creep.body.length;

        switch (actor.creep.memory.role)
        {
            case RoleType.Builder:
                allBuilders.push(actor);
                break;
            case RoleType.Harvester:
                allHarvesters.push(actor);
                break;
            case RoleType.Repairer:
                allRepairers.push(actor);
                break;
            case RoleType.Supplier:
                allSuppliers.push(actor);
                break;
            case RoleType.Upgrader:
                allUpgraders.push(actor);
                break;
            default:
                console.log("Unhandled creep role parameter: " + actor.creep.memory.role);
                continue;
        }

        if (actor.creep.spawning)
            continue;

        actor.init(RoleFactory.getPrototype(actor.creep.memory.role));
    }

    //console.log("Actor phase run!");

    for (var i = 0; i < actors.length; i++)
    {
        actor = actors[i];

        if (actor.creep.spawning)
            continue;

        actor.run();
    }

    //console.log("Actor phase end!");

    for (var i = 0; i < actors.length; i++)
    {
        actor = actors[i];

        if (actor.creep.spawning)
            continue;

        actor.end();
    }

    var spawn = Game.spawns["Spawn[home]"];
    if (spawn == null)
    {
        console.log("Unable to find home spawn!");
        return;
    }

    const doDebug = false;

    const energyAvailable = spawn.room.energyAvailable;
    const energyCapacity = spawn.room.energyCapacityAvailable;

    const targetBodyPartCount = 60 + Math.floor((energyCapacity - 300) / 3);
    
    if (!spawn.spawning)
    {
        var spawnQueue = spawn.memory.spawnQueue;
        if (spawnQueue == undefined || spawnQueue == null)
        {
            console.log("Initializing spawn queue!");
            spawnQueue = [];
        }
        //else if (spawnQueue.length == 0)
        //{
        //    console.log("Spawn queue is empty!");
        //}
        //else
        //{
        //    console.log("Spawn queue has " + spawnQueue.length + " entries:");
        //    for (var i = 0; i < spawnQueue.length; i++)
        //        console.log("[" + i + "]: " + Utils.objectToString(spawnQueue[i]));
        //}

        var newBlueprint = null;
        if (spawnQueue.length > 0)
        {
            var nextIndex = spawnQueue.length - 1;
            var nextBlueprint = spawnQueue[nextIndex];
            if (nextBlueprint == undefined || nextBlueprint == null)
            {
                console.log("Invalid blueprint " + nextBlueprint + " in spawn queue at position " + nextIndex);
                spawnQueue.pop();
            }
            else if (nextBlueprint.cost > energyAvailable)
            {
                //console.log("Blueprint cost " + nextBlueprint.cost + " is higher than available energy " +
                //    energyAvailable + ", waiting...");
            }
            else
            {
                if (nextBlueprint.budget < energyCapacity)
                {
                    console.log("Energy capacity has increased since creating blueprint of " + nextBlueprint.namePrefix +
                        "! Updating blueprint at spawn queue position " + nextIndex);

                    nextBlueprint = CreepFactory.buildBlueprintByRole(nextBlueprint.roleType, energyCapacity, 50);
                }

                CreepFactory.buildCreepFromBlueprint(spawn, nextBlueprint);
                spawnQueue.pop();
            }

        }
        else // Pick a role to build based on parameters
        {
            const minNumBuilders = 1;
            const minNumHarvesters = 2;
            const minNumUpgraders = 1;
            const minNumRepairers = 1;
            const minNumSuppliers = 2;

            var roleToBuild = -1;

            if (allHarvesters.length < minNumHarvesters)
            {
                //if (doDebug)
                    console.log("Too few Harvesters (" + allHarvesters.length + " < " + minNumHarvesters + ")!");

                roleToBuild = RoleType.Harvester;
            }
            else if (allSuppliers.length < minNumSuppliers)
            {
                //if (doDebug)
                    console.log("Too few Suppliers (" + allSuppliers.length + " < " + minNumSuppliers + ")!");

                roleToBuild = RoleType.Supplier;
            }
            else if (allBuilders.length < minNumBuilders)
            {
                //if (doDebug)
                    console.log("Too few Builders (" + allBuilders.length + " < " + minNumBuilders + ")!");

                roleToBuild = RoleType.Builder;
            }
            else if (allUpgraders.length < minNumUpgraders)
            {
                //if (doDebug)
                    console.log("Too few Upgraders (" + allUpgraders.length + " < " + minNumUpgraders + ")!");

                roleToBuild = RoleType.Upgrader;
            }
            else if (allRepairers.length < minNumRepairers)
            {
                //if (doDebug)
                    console.log("Too few Repairers (" + allRepairers.length + " < " + minNumRepairers + ")!");

                roleToBuild = RoleType.Repairer;
            }
            else if (bodyPartCount < targetBodyPartCount)
            {
                var weights =
                [
                    { "role": RoleType.Builder,   "count": allBuilders.length,   "weight": 1.5 },
                    { "role": RoleType.Harvester, "count": allHarvesters.length, "weight": 2.5 },
                    { "role": RoleType.Repairer,  "count": allRepairers.length,  "weight": 1.0 },
                    { "role": RoleType.Supplier,  "count": allSuppliers.length,  "weight": 1.0 },
                    { "role": RoleType.Upgrader,  "count": allUpgraders.length,  "weight": 1.0 },
                ]

                var roleWeight;

                var totalWeight = 0.0;
                for (var i = 0; i < weights.length; i++)
                {
                    roleWeight = weights[i];
                    totalWeight += roleWeight.weight;
                }

                var highestWeight = 0.0;
                for (var i = 0; i < weights.length; i++)
                {
                    roleWeight = weights[i];
                    roleWeight.ratio = roleWeight.count / actors.length;
                    roleWeight.targetRatio = roleWeight.weight / totalWeight;
                    roleWeight.w = roleWeight.targetRatio / roleWeight.ratio;

                    if (roleWeight.w > highestWeight)
                    {
                        roleToBuild = roleWeight.role;
                        highestWeight = roleWeight.w;
                    }
                }

                if (doDebug)
                {
                    var msg = "";
                    var roleWeight;
                    for (var i = 0; i < weights.length; i++)
                    {
                        roleWeight = weights[i];
                        msg += (i > 0 ? "\n" : "") + Object.keys(RoleType)[roleWeight.role + 1] + " count: " + roleWeight.count;
                        msg += ", weight: " + roleWeight.w + ", ratio: " + roleWeight.ratio + ", target: " + roleWeight.targetRatio;
                    }
                    console.log("Creeps: " + actors.length + ", body parts: " + bodyPartCount + "/" + targetBodyPartCount + "\n" + msg);
                }
            }
            //else
            //{
            //    if (doDebug)
            //        console.log("Body part count target reached: " + bodyPartCount + "/" + targetBodyPartCount);
            //}

            if (roleToBuild >= 0)
                newBlueprint = CreepFactory.buildBlueprintByRole(roleToBuild, energyCapacity, 50);
        }

        if (newBlueprint != null)
        {
            spawnQueue.push(newBlueprint);

            if (doDebug)
            {
                console.log("Added a creep blueprint " + newBlueprint.namePrefix + " to spawn queue at Spawn('" + spawn.name +
                    "')[" + spawn.pos + "] in " + spawn.room + ", energy cost: " + newBlueprint.cost + "/" + newBlueprint.budget +
                    "\nbody parts: [" + newBlueprint.parts + "]");
            }
        }

        spawn.memory.spawnQueue = spawnQueue;
    }
    
    // Commit to memory

    if (Memory.actors == undefined)
    {
        console.log("Initializing actors memory object!");
        Memory.actors = {};
    }

    Memory.actors["Count"] = actors.length;
    Memory.actors["BodyPartsTotal"] = bodyPartCount;
    Memory.actors["BodyPartsTarget"] = targetBodyPartCount;
    Memory.actors[Object.keys(RoleType)[RoleType.Builder + 1]] = allBuilders.length;
    Memory.actors[Object.keys(RoleType)[RoleType.Harvester + 1]] = allHarvesters.length;
    Memory.actors[Object.keys(RoleType)[RoleType.Repairer + 1]] = allRepairers.length;
    Memory.actors[Object.keys(RoleType)[RoleType.Supplier + 1]] = allSuppliers.length;
    Memory.actors[Object.keys(RoleType)[RoleType.Upgrader + 1]] = allUpgraders.length;
}