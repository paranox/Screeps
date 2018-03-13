var utils = require('utils');
var creepFactory = require('creepFactory');

var roles = require('roles');
var roleType = require('roleTypes');

module.exports.loop = function ()
{
    roles.initPrototypes();

    for (var name in Memory.creeps)
    {
        if (!Game.creeps[name])
        {
            delete Memory.creeps[name];
            console.log('Removed non-existing creep from memory: ' + name);
            continue;
        }
    }

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

    const targetBodyPartCount = 120;

    var creepCount = 0;
    var bodyPartCount = 0;

    var allHarvesters = [];//_.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var allUpgraders = [];
    var allBuilders = [];
    var allRepairers = [];

    var creep, role;
    for (var name in Game.creeps)
    {
        role = null;
        creepCount++;

        creep = Game.creeps[name];
        bodyPartCount += creep.body.length;

        switch (creep.memory.role)
        {
            case 'builder':
                role = roles.getPrototype(roleType.Builder);
                allBuilders.push(creep);
                break;
            case 'harvester':
                role = roles.getPrototype(roleType.Harvester);
                allHarvesters.push(creep);
                break;
            case 'upgrader':
                role = roles.getPrototype(roleType.Upgrader);
                allUpgraders.push(creep);
                break;
            case 'repairer':
                role = roles.getPrototype(roleType.Repairer);
                allRepairers.push(creep);
                break;
        }

        if (role != null)
        {
            if (creep.memory.role == 'repairer')
                role.init(creep);

            role.run(creep);

            if (creep.memory.role == 'repairer')
                role.clear(creep);
        }
    }

    var spawn = Game.spawns["Spawn.home"];
    if (spawn == null)
    {
        console.log("Unable to find home spawn!");
        return;
    }
    else if (spawn.spawning)
        return;

    const minNumHarvesters = 4;
    const minNumUpgraders = 2;
    const minNumBuilders = 2;
    const minNumRepairers = 2;
    
    const targetWeightBuilders = 2.0;
    const targetWeightHarvesters = 1.0;
    const targetWeightUpgraders = 1.5;
    const targetWeightRepairers = 1.0;

    var roleToBuild = -1;
    var energyCapacity = spawn.room.energyCapacityAvailable;

    if (allHarvesters.length < minNumHarvesters)
    {
        //console.log("Too few Harvesters (" + allHarvesters.length + " < " + minNumHarvesters + ")!");
        roleToBuild = roleType.Harvester;
    }
    else if (allBuilders.length < minNumBuilders)
    {
        //console.log("Too few Builders (" + allBuilders.length + " < " + minNumBuilders + ")!");
        roleToBuild = roleType.Builder;
    }
    else if (allUpgraders.length < minNumUpgraders)
    {
        //console.log("Too few Upgraders (" + allUpgraders.length + " < " + minNumUpgraders + ")!");
        roleToBuild = roleType.Upgrader;
    }
    else if (allRepairers.length < minNumRepairers)
    {
        //console.log("Too few Repairers (" + allRepairers.length + " < " + minNumRepairers + ")!");
        roleToBuild = roleType.Repairer;
    }
    else
    {
        if (bodyPartCount >= targetBodyPartCount)
        {
            //console.log("Body part count target reached: " + bodyPartCount + "/" + targetBodyPartCount);
            return;
        }

        //console.log("Current creep body part count: " + bodyPartCount + ", target: " + targetBodyPartCount);
    }

    if (roleToBuild == -1)
    {
        var ratioBuilders = allBuilders.length / creepCount;
        var ratioHarvesters = allHarvesters.length / creepCount;
        var ratioUpgraders = allUpgraders.length / creepCount;
        var ratioRepairers = allRepairers.length / creepCount;

        /*console.log("Creeps: Builder(weight: " + targetWeightBuilders + "): " + allBuilders.length +
            ", Harvesters(weight: " + targetWeightHarvesters + "): " + allHarvesters.length +
            ", Upgraders(weight: " + targetWeightUpgraders + "): " + allUpgraders.length +
            ", Repairers(weight: " + targetWeightRepairers + "): " + allRepairers.length +
            " of total " + creepCount);*/

        var weightBuilders = targetWeightBuilders - ratioBuilders;
        var weightHarvesters = targetWeightHarvesters - ratioHarvesters;
        var weightUpgraders = targetWeightUpgraders - ratioUpgraders;
        var weightRepairers = targetWeightRepairers - ratioRepairers;

        if (weightHarvesters > weightBuilders && weightHarvesters > weightUpgraders)
        {
            //console.log("Repairers needed most: " + weightHarvesters + " > " +
                //weightBuilders + ", " + weightRepairers + ", " + weightUpgraders);

            roleToBuild = roleType.Harvester;
        }
        else if (weightBuilders > weightHarvesters && weightBuilders > weightUpgraders)
        {
            //console.log("Repairers needed most: " + weightBuilders + " > " +
                //weightHarvesters + ", " + weightRepairers + ", " + weightUpgraders);
            
            roleToBuild = roleType.Builder;
        }
        else if (weightRepairers > weightBuilders && weightRepairers > weightHarvesters && weightRepairers > weightUpgraders)
        {
            //console.log("Repairers needed most: " + weightRepairers + " > " +
                //weightBuilders + ", " + weightHarvesters + ", " + weightUpgraders);

            roleToBuild = roleType.Repairer;
        }
        else
        {
            //console.log("Repairers needed most: " + weightUpgraders + " > " +
                //weightBuilders + ", " + weightHarvesters + ", " + weightRepairers);

            roleToBuild = roleType.Upgrader;
        }
    }

    var blueprint = creepFactory.buildBlueprintByRole(roleToBuild, energyCapacity, 50);
    if (blueprint != null)
        creepFactory.buildCreepFromBlueprint(spawn, blueprint);
}