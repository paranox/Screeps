var utils = require('utils');
var roles = require('roles');

var getPrototypeBuilder = function ()
{
    var prototype = {};

    prototype.namePrefix = "Builder";
    prototype.minimumParts = [WORK, CARRY, MOVE];
    prototype.partWeightMap = {};
    prototype.partWeightMap[WORK] = 2.0;
    prototype.partWeightMap[CARRY] = 2.0;
    prototype.partWeightMap[MOVE] = 1.0;
    prototype.opts = { memory: { role: 'builder' } };

    return prototype;
}

var getPrototypeHarvester = function ()
{
    var prototype = {};

    prototype.namePrefix = "Harvester";
    prototype.minimumParts = [WORK, CARRY, MOVE];
    prototype.partWeightMap = {};
    prototype.partWeightMap[WORK] = 2.0;
    prototype.partWeightMap[CARRY] = 1.0;
    prototype.partWeightMap[MOVE] = 2.0;
    prototype.opts = { memory: { role: 'harvester' } };

    return prototype;
}

var getPrototypeUpgrader = function ()
{
    var prototype = {};

    prototype.namePrefix = "Upgrader";
    prototype.minimumParts = [WORK, CARRY, MOVE];
    prototype.partWeightMap = {};
    prototype.partWeightMap[WORK] = 2;
    prototype.partWeightMap[CARRY] = 2;
    prototype.partWeightMap[MOVE] = 1;
    prototype.opts = { memory: { role: 'upgrader' } };

    return prototype;
}

var getPrototype = function (role)
{
    switch (role)
    {
        case roles.Harvester:
            return getPrototypeHarvester();
        case roles.Builder:
            return getPrototypeBuilder();
        case roles.Upgrader:
            return getPrototypeUpgrader();
    }

    console.log("Unhandled Creep prototype role: " + role);
    return null;
}

var getPartList = function (minimumParts, partWeights, energyCapacityAvailable, maxParts)
{
    //var initialBodyCost = utils.getBodyCost(initialParts);
    //console.log("Initial list of parts: [" + initialParts + "], energy cost: " + initialBodyCost +
    //", extra budget: " + (energyCapacityAvailable - initialBodyCost));

    // Add initial parts to map

    var partMap = {};

    var i, p;
    var totalParts = 0;
    for (i = 0; i < minimumParts.length; i++)
    {
        var p = minimumParts[i];
        if (partMap.hasOwnProperty(p))
        {
            partMap[p]++;
            //console.log("Initial list now has " + partMap[p] + " parts of type " + p);
        }
        else
        {
            partMap[p] = 1;
            //console.log("Initial list contains a new part type of " + p);
        }

        totalParts++;
    }

    // Calculate part weights if found

    var w;
    var totalCostMod = 0;
    for (var type in partWeights)
    {
        w = partWeights[type];
        totalCostMod += w * utils.getBodyPartCost(type);
        //console.log("Weight of extra part of type : " + type + "(" + (typeof type) + "):" + w);
    }

    //console.log("Total weight of extra parts: " + totalWeight + ", cost mod: " + totalCostMod);

    // Find all parts and the count to add

    var min, max;
    for (var type in BODYPART_COST)
    {
        p = 0;
        min = 0;

        if (partMap.hasOwnProperty(type))
        {
            min = partMap[type];

            //console.log("Minimum parts of type " + type + ": " + min);
        }

        if (partWeights.hasOwnProperty(type))
        {
            w = Number(partWeights[type]);
            i = w * (energyCapacityAvailable / totalCostMod);   // Weighted count
            max = Math.floor(maxParts * w);                     // Absolute maximum of this type
            p = Math.min(i, max);

            //console.log("Weighted maximum parts of type " + type + ": " + p +
            //" (weight: " + w + ", max: " + max + "/" + maxParts + ")");

        }

        p = Math.max(min, p);

        if (p > 0)
            partMap[type] = p;
    }

    // Finalize the part list

    var partList = [];

    for (var type in partMap)
    {
        p = partMap[type];

        if (p > 0)
        {
            for (i = 1; i < p; i++)
                partList.push(type);

            //console.log("Added " + (i - 1) + "/" + p + " parts of type " + type + "(" + (typeof type) + ")");
        }
    }

    //console.log("Final part list: [" + partList + "], cost: " + utils.getBodyCost(partList));

    return partList;
}

var getBluePrintFromPrototype = function (prototype, energyCapacityAvailable, maxParts)
{
    var blueprint = {};
    blueprint.namePrefix = prototype.namePrefix;
    blueprint.parts = getPartList(prototype.minimumParts, prototype.partWeightMap, energyCapacityAvailable, maxParts);
    blueprint.opts = prototype.opts;

    console.log("Blueprint: " + Object.keys(blueprint));

    return blueprint;
}

var creepFactory =
{
    getPrototypeByRole: function (role)
    {
        return getPrototype(role);
    },

    buildPartList: function (minimumParts, partWeights, energyCapacityAvailable, maxParts)
    {
        return getPartList(minimumParts, partWeights, energyCapacityAvailable, maxParts);
    },

    buildBlueprintFromPrototype: function (prototype, energyCapacityAvailable, maxParts)
    {
        return getBluePrintFromPrototype(prototype, energyCapacityAvailable, maxParts);
    },

    buildBlueprintByRole: function (role, energyCapacityAvailable, maxParts)
    {
        var prototype = getPrototype(role);
        console.log("Prototype: " + Object.keys(prototype));
        return getBluePrintFromPrototype(prototype, energyCapacityAvailable, maxParts);
    },

    buildCreepFromBlueprint: function (spawn, blueprint)
    {
        console.log("Build blueprint: " + Object.keys(blueprint));

        var newName = blueprint.namePrefix + Game.time;

        var status = spawn.spawnCreep(blueprint.parts, newName, blueprint.opts);
        if (status == 0)
        {
            console.log("Building creep: '" + newName + "' at Spawn('" + spawn.name + "')[" + spawn.pos.x + "," + spawn.pos.y + "] in " +
                spawn.room + ", energy cost: " + utils.getBodyCost(blueprint.parts) + "\nbody parts: [" + blueprint.parts + "]");
        }
    }
}

module.exports = creepFactory;