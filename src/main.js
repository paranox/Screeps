var utils = require('utils');
var creepFactory = require('creepFactory');

var Actor = require('actor');
var Roles = require('roles');
var RoleType = require('roleTypes');

module.exports.loop = function ()
{
    Roles.initPrototypes();

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

    const targetBodyPartCount = 120;

    var bodyPartCount = 0;

    var allHarvesters = [];//_.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var allUpgraders = [];
    var allBuilders = [];
    var allRepairers = [];

    var role;
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
            case RoleType.Upgrader:
                allUpgraders.push(actor);
                break;
            case RoleType.Repairer:
                allRepairers.push(actor);
                break;
            default:
                console.log("Unhandled creep role parameter: " + actor.creep.memory.role);
                continue;
        }

        role = Roles.getPrototype(actor.creep.memory.role);

        if (role != null)
        {
            role.init(actor);
            role.run(actor);
            role.end(actor);
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
    
    const targetRatioBuilders = 2.0;
    const targetRatioHarvesters = 1.0;
    const targetRatioUpgraders = 1.5;
    const targetRatioRepairers = 1.0;

    var roleToBuild = -1;
    var energyCapacity = spawn.room.energyCapacityAvailable;

    if (allHarvesters.length < minNumHarvesters)
    {
        //console.log("Too few Harvesters (" + allHarvesters.length + " < " + minNumHarvesters + ")!");
        roleToBuild = RoleType.Harvester;
    }
    else if (allBuilders.length < minNumBuilders)
    {
        //console.log("Too few Builders (" + allBuilders.length + " < " + minNumBuilders + ")!");
        roleToBuild = RoleType.Builder;
    }
    else if (allUpgraders.length < minNumUpgraders)
    {
        //console.log("Too few Upgraders (" + allUpgraders.length + " < " + minNumUpgraders + ")!");
        roleToBuild = RoleType.Upgrader;
    }
    else if (allRepairers.length < minNumRepairers)
    {
        //console.log("Too few Repairers (" + allRepairers.length + " < " + minNumRepairers + ")!");
        roleToBuild = RoleType.Repairer;
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
        var ratioBuilders = allBuilders.length / actors.length;
        var ratioHarvesters = allHarvesters.length / actors.length;
        var ratioUpgraders = allUpgraders.length / actors.length;
        var ratioRepairers = allRepairers.length / actors.length;

        /*console.log("Creeps: Builder(weight: " + targetRatioBuilders + "): " + allBuilders.length +
            ", Harvesters(weight: " + targetRatioHarvesters + "): " + allHarvesters.length +
            ", Upgraders(weight: " + targetRatioUpgraders + "): " + allUpgraders.length +
            ", Repairers(weight: " + targetRatioRepairers + "): " + allRepairers.length +
            " of total " + actors.length);*/

        var weightBuilders = targetRatioBuilders - ratioBuilders;
        var weightHarvesters = targetRatioHarvesters - ratioHarvesters;
        var weightUpgraders = targetRatioUpgraders - ratioUpgraders;
        var weightRepairers = targetRatioRepairers - ratioRepairers;

        if (weightHarvesters > weightBuilders && weightHarvesters > weightUpgraders)
        {
            //console.log("Repairers needed most: " + weightHarvesters + " > " +
                //weightBuilders + ", " + weightRepairers + ", " + weightUpgraders);

            roleToBuild = RoleType.Harvester;
        }
        else if (weightBuilders > weightHarvesters && weightBuilders > weightUpgraders)
        {
            //console.log("Repairers needed most: " + weightBuilders + " > " +
                //weightHarvesters + ", " + weightRepairers + ", " + weightUpgraders);
            
            roleToBuild = RoleType.Builder;
        }
        else if (weightRepairers > weightBuilders && weightRepairers > weightHarvesters && weightRepairers > weightUpgraders)
        {
            //console.log("Repairers needed most: " + weightRepairers + " > " +
                //weightBuilders + ", " + weightHarvesters + ", " + weightUpgraders);

            roleToBuild = RoleType.Repairer;
        }
        else
        {
            //console.log("Repairers needed most: " + weightUpgraders + " > " +
                //weightBuilders + ", " + weightHarvesters + ", " + weightRepairers);

            roleToBuild = RoleType.Upgrader;
        }
    }

    var blueprint = creepFactory.buildBlueprintByRole(roleToBuild, energyCapacity, 50);
    if (blueprint != null)
        creepFactory.buildCreepFromBlueprint(spawn, blueprint);
}