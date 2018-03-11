var utils = require('utils');
var creepFactory = require('creepFactory');

var roles = require('roles');
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
//require('role.builder');

module.exports.loop = function ()
{
    for (var name in Memory.creeps)
    {
        if (!Game.creeps[name])
        {
            delete Memory.creeps[name];
            console.log('Removed non-existing creep from memory: ' + name);
            continue;
        }
    }

    var tower = Game.getObjectById('a878af84ec73a0b43ccd746c');
    if (tower != null)
    {
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, 
            { filter: (structure) => structure.hits < structure.hitsMax });

        if (closestDamagedStructure != null)
            tower.repair(closestDamagedStructure);

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

        if (closestHostile != null)
            tower.attack(closestHostile);
    }

    var allHarvesters = [];//_.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
    var allUpgraders = [];
    var allBuilders = [];

    var creep, role;
    for (var name in Game.creeps)
    {
        role = null;
        creep = Game.creeps[name];

        switch (creep.memory.role)
        {
            case 'harvester':
                //role = new roleHarvester();
                allHarvesters.push(creep);
                break;
            case 'upgrader':
                //role = new roleUpgrader();
                allUpgraders.push(creep);
                break;
            case 'builder':
                /* This segment doesn't work: ReferenceError: RoleBuilder is not defined
                 * Tried using 'require('role.builder');' instead of the 'var roleBuilder =...'
                role = new RoleBuilder();
                */
                /* This segment works with 'var roleBuilder = require('role.builder')'
                 * Doesn't call the constructor of RoleBuilder prototype defined in role.builder.js
                 * which would be ideal but ultimately a workable solution, I guess.
                role = Object.create(roleBuilder);
                */
                role = Object.create(roleBuilder);
                role.constructor();
                allBuilders.push(creep);
                break;
        }

        if (role != null)
        {
            role.init(creep);
            role.run(creep);
        }
    }

    const minNumHarvesters = 4;
    const weightHarvesters = 1.0;
    const minNumUpgraders = 2;
    const weightUpgraders = 1.0;
    const minNumBuilders = 2;
    const weightBuilders = 1.0;

    var spawn = Game.spawns["Spawn.home"];

    if (spawn == null)
        console.log("Unable to find home spawn!");
    else if (!spawn.spawning)
    {
        if (allHarvesters.length < minNumHarvesters)
        {
            //console.log("Too few Harvesters (" + allHarvesters.length + "/" + minNumHarvesters + ")!");

            var blueprint = creepFactory.buildBlueprintByRole(roles.Harvester, spawn.room.energyCapacityAvailable, 50);
            creepFactory.buildCreepFromBlueprint(spawn, blueprint);
        }
        else if (allBuilders.length < minNumBuilders)
        {
            //console.log("Too few Builders (" + allBuilders.length + "/" + minNumBuilders + ")!");

            var blueprint = creepFactory.buildBlueprintByRole(roles.Builder, spawn.room.energyCapacityAvailable, 50);
            creepFactory.buildCreepFromBlueprint(spawn, blueprint);
        }
        else if (allUpgraders.length < minNumUpgraders)
        {
            //console.log("Too few Upgraders (" + allUpgraders.length + "/" + minNumUpgraders + ")!");

            var blueprint = creepFactory.buildBlueprintByRole(roles.Upgrader, spawn.room.energyCapacityAvailable, 50);
            creepFactory.buildCreepFromBlueprint(spawn, blueprint);
        }
    }
}