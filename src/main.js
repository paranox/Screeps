var Utils = require('utils');
var Empire = require('empire');
var Role = require('roleTypes');
var RoleFactory = require('roleFactory');
var CreepFactory = require('creepFactory');

module.exports.loop = function ()
{
    const doDebug = false;

    for (var name in Memory.creeps)
    {
        if (!Game.creeps[name])
        {
            var id = Memory.creeps[name].id;
            console.log("Removing non-existing creep from memory: name: " + name + ", id: " + id);
            delete Memory.creeps[name];
        }
    }

    RoleFactory.initPrototypes();

    Empire.init();

    Empire.onTickStart();

    //console.log("Actor phase init!");

    var actor, op;

    for (var id in Game.empire.operations)
    {
        op = Game.empire.operations[id];
        //console.log("Operation " + id + "(" + op.opType + "), updating...");
        op.update();
    }

    //console.log("Actor phase run!");

    for (var id in Game.empire.actors)
    {
        actor = Game.empire.actors[id];
        actor.run();
    }

    //console.log("Actor phase end!");

    for (var id in Game.empire.actors)
    {
        actor = Game.empire.actors[id];
        actor.end();
    }

    for (var id in Game.empire.operations)
    {
        op = Game.empire.operations[id];
        //console.log("Operation " + id + "(" + op.opType + "), end of tick");
        op.end();
    }
    
    /// Commit to memory ///

    Empire.onTickEnd();

    /// Old crap ///

    var tower = Game.getObjectById('e17b3c1b438785d');
    if (tower != null)
    {
        /*var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, 
            { filter: (structure) => structure.hits < structure.hitsMax });

        if (closestDamagedStructure != null)
            tower.repair(closestDamagedStructure);*/

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if (closestHostile != null)
        {
            console.log("Alert! Tower at " + tower.pos + " attacking hostile at " + closestHostile.pos);
            tower.attack(closestHostile);
        }
        else
        {
            var friendlies = tower.pos.findInRange(FIND_MY_CREEPS, 10);
            if (friendlies.length > 0)
            {
                var creep, priority;
                var highestPriority = 0;
                var chosenTarget = null;
                for (var i = 0; i < friendlies.length; i++)
                {
                    creep = friendlies[i];
                    if (creep.hits < creep.hitsMax)
                    {
                        priority = creep.hits / creep.hitsMax;
                        if (priority > highestPriority)
                        {
                            chosenTarget = creep;
                            highestPriority = priority;
                        }
                    }
                }

                if (chosenTarget != null)
                    tower.heal(chosenTarget);
            }
        }
    }

    /*const targetBodyPartCount = 60 + Math.floor((energyCapacity - 300) / 3);
    
    if (!spawn.spawning)
    {
        //else if (spawnQueue.length == 0)
        //{
        //    console.log("Spawn queue is empty!");
        //}
        //else
        //{
        //    console.log("Spawn queue has " + spawnQueue.length + " entries:");
        //    for (var i = 0; i < spawnQueue.length; i++)
        //        console.log("[" + i + "]: " + JSON.stringify(spawnQueue[i]));
        //}

        else // Pick a role to build based on parameters
        {
            const minNumBuilders = 1;
            const minNumHarvesters = 3;
            const minNumUpgraders = 1;
            const minNumRepairers = 1;
            const minNumSuppliers = 2;

            const countSuppliers = Game.empire.roles.getCount(Role.Type.Supplier);
            const countHarvesters = Game.empire.roles.getCount(Role.Type.Harvester);
            const countBuilders = Game.empire.roles.getCount(Role.Type.Builder);
            const countUpgraders = Game.empire.roles.getCount(Role.Type.Upgrader);
            const countRepairers = Game.empire.roles.getCount(Role.Type.Repairer);

            var roleToBuild = -1;

            if (countSuppliers < minNumSuppliers)
            {
                //if (doDebug)
                    console.log("Too few Suppliers (" + countSuppliers + " < " + minNumSuppliers + ")!");

                roleToBuild = Role.Type.Supplier;
            }
            else if (countHarvesters < minNumHarvesters)
            {
                //if (doDebug)
                    console.log("Too few Harvesters (" + countHarvesters + " < " + minNumHarvesters + ")!");

                roleToBuild = Role.Type.Harvester;
            }
            else if (countBuilders < minNumBuilders)
            {
                //if (doDebug)
                    console.log("Too few Builders (" + countBuilders + " < " + minNumBuilders + ")!");

                roleToBuild = Role.Type.Builder;
            }
            else if (countUpgraders < minNumUpgraders)
            {
                //if (doDebug)
                    console.log("Too few Upgraders (" + countUpgraders + " < " + minNumUpgraders + ")!");

                roleToBuild = Role.Type.Upgrader;
            }
            else if (countRepairers < minNumRepairers)
            {
                //if (doDebug)
                    console.log("Too few Repairers (" + countRepairers + " < " + minNumRepairers + ")!");

                roleToBuild = Role.Type.Repairer;
            }
            else if (Game.empire.bodies.countTotal < targetBodyPartCount)
            {
                var weights =
                [
                    { role: Role.Type.Builder,   count: countBuilders,   weight: 1.5 },
                    { role: Role.Type.Harvester, count: countHarvesters, weight: 2.5 },
                    { role: Role.Type.Repairer,  count: countRepairers,  weight: 1.5 },
                    { role: Role.Type.Supplier,  count: countSuppliers,  weight: 1.0 },
                    { role: Role.Type.Upgrader,  count: countUpgraders,  weight: 1.0 }
                ];

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
                    roleWeight.ratio = roleWeight.count / Game.empire.actorCount;
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
                        msg += (i > 0 ? "\n" : "") + Role.getNameOf(roleWeight.role) + " count: " + roleWeight.count;
                        msg += ", weight: " + roleWeight.w + ", ratio: " + roleWeight.ratio + ", target: " + roleWeight.targetRatio;
                    }

                    console.log("Creeps: " + Game.empire.actorCount + ", body parts: " +
                        Game.empire.bodies.countTotal + "/" + targetBodyPartCount + "\n" + msg);
                }
            }
            else
            {
                if (doDebug)
                    console.log("Body part count target reached: " + Game.empire.bodies.countTotal + "/" + targetBodyPartCount);
            }

            if (roleToBuild >= 0)
                nextBlueprint = CreepFactory.buildBlueprintByRole(roleToBuild, energyCapacity, 50);

            if (nextBlueprint != null)
                CreepFactory.addBlueprintToSpawnQueue(spawn, nextBlueprint);
        }

        if (chosenBlueprint != null)
    }*/
}