var Utils = require('utils');
var Home = require('home');
var Actor = require('actor');
var Role = require('roleTypes');
var RoleFactory = require('roleFactory');
var CreepFactory = require('creepFactory');

module.exports.loop = function ()
{
    const doDebug = false;

    for (var name in Memory.spawns)
    {
        if (!Game.spawns[name])
        {
            console.log('Should remove non-existing spawn from memory: ' + name);
            continue;
        }
    }

    if (Memory.homes == undefined)
        Memory.homes = [];

    var home;
    var homes = [];
    for (var name in Game.spawns)
    {
        home = Object.create(Home);
        home.constructor(Game.spawns[name]);
        home.init();

        homes.push(home);
    }

    RoleFactory.initPrototypes();

    for (var name in Memory.creeps)
    {
        if (!Game.creeps[name])
        {
            delete Memory.creeps[name];
            console.log('Removed non-existing creep from memory: ' + name);
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
            case Role.Type.Builder:
                allBuilders.push(actor);
                break;
            case Role.Type.Harvester:
                allHarvesters.push(actor);
                break;
            case Role.Type.Repairer:
                allRepairers.push(actor);
                break;
            case Role.Type.Supplier:
                allSuppliers.push(actor);
                break;
            case Role.Type.Upgrader:
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

    home = homes[0];
    home.setRoleCount(Role.Type.Builder, allBuilders.length);
    home.setRoleCount(Role.Type.Harvester, allHarvesters.length);
    home.setRoleCount(Role.Type.Repairer, allRepairers.length);
    home.setRoleCount(Role.Type.Supplier, allSuppliers.length);
    home.setRoleCount(Role.Type.Upgrader, allUpgraders.length);

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

    for (var i = 0; i < homes.length; i++)
    {
        home = homes[i];
        home.end();
    }

    var spawn = Game.spawns["Spawn[home]"];
    if (spawn == null)
    {
        console.log("Unable to find home spawn!");
        return;
    }

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

            if (allSuppliers.length < minNumSuppliers)
            {
                //if (doDebug)
                    console.log("Too few Suppliers (" + allSuppliers.length + " < " + minNumSuppliers + ")!");

                roleToBuild = Role.Type.Supplier;
            }
            else if (allHarvesters.length < minNumHarvesters)
            {
                //if (doDebug)
                    console.log("Too few Harvesters (" + allHarvesters.length + " < " + minNumHarvesters + ")!");

                roleToBuild = Role.Type.Harvester;
            }
            else if (allBuilders.length < minNumBuilders)
            {
                //if (doDebug)
                    console.log("Too few Builders (" + allBuilders.length + " < " + minNumBuilders + ")!");

                roleToBuild = Role.Type.Builder;
            }
            else if (allUpgraders.length < minNumUpgraders)
            {
                //if (doDebug)
                    console.log("Too few Upgraders (" + allUpgraders.length + " < " + minNumUpgraders + ")!");

                roleToBuild = Role.Type.Upgrader;
            }
            else if (allRepairers.length < minNumRepairers)
            {
                //if (doDebug)
                    console.log("Too few Repairers (" + allRepairers.length + " < " + minNumRepairers + ")!");

                roleToBuild = Role.Type.Repairer;
            }
            else if (bodyPartCount < targetBodyPartCount)
            {
                var weights =
                [
                    { "role": Role.Type.Builder,   "count": allBuilders.length,   "weight": 1.5 },
                    { "role": Role.Type.Harvester, "count": allHarvesters.length, "weight": 2.5 },
                    { "role": Role.Type.Repairer,  "count": allRepairers.length,  "weight": 1.5 },
                    { "role": Role.Type.Supplier,  "count": allSuppliers.length,  "weight": 1.0 },
                    { "role": Role.Type.Upgrader,  "count": allUpgraders.length,  "weight": 1.0 },
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
                        msg += (i > 0 ? "\n" : "") + Object.keys(Role.Type)[roleWeight.role + 1] + " count: " + roleWeight.count;
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
    Memory.actors[Object.keys(Role.Type)[Role.Type.Builder + 1]] = allBuilders.length;
    Memory.actors[Object.keys(Role.Type)[Role.Type.Harvester + 1]] = allHarvesters.length;
    Memory.actors[Object.keys(Role.Type)[Role.Type.Repairer + 1]] = allRepairers.length;
    Memory.actors[Object.keys(Role.Type)[Role.Type.Supplier + 1]] = allSuppliers.length;
    Memory.actors[Object.keys(Role.Type)[Role.Type.Upgrader + 1]] = allUpgraders.length;
}