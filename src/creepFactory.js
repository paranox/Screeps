var utils = require('utils');
var roles = require('roles');

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
    blueprint.namePrefix = prototype.roleName;
    blueprint.parts = getPartList(prototype.minimumParts, prototype.partWeightMap, energyCapacityAvailable, maxParts);
    blueprint.opts = prototype.opts;

    //console.log("Blueprint: " + Object.keys(blueprint));

    return blueprint;
}

var creepFactory =
{
    getPrototypeByRole: function (role)
    {
        return roles.getPrototype(role);
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
        var prototype = roles.getPrototype(role);
        if (prototype != undefined && prototype != null)
        {
            //console.log("Prototype[" + role + "]: " + prototype.roleName + "(" + (typeof prototype) + ")");
            return getBluePrintFromPrototype(prototype, energyCapacityAvailable, maxParts);
        }

        console.log("No prototype found for role " + role);
        return null;
    },

    buildCreepFromBlueprint: function (spawn, blueprint)
    {
        if (blueprint == undefined || blueprint == null)
        {
            console.log("Invalid blueprint provided: " + blueprint);
            return;
        }

        //console.log("Build blueprint: " + Object.keys(blueprint));

        var newName = blueprint.namePrefix + Game.time;

        var status = spawn.spawnCreep(blueprint.parts, newName, blueprint.opts);
        if (status == 0)
        {
            console.log("Building creep: '" + newName + "' at Spawn('" + spawn.name + "')[" + spawn.pos.x + "," + spawn.pos.y + "] in " +
                spawn.room + ", energy cost: " + utils.getBodyCost(blueprint.parts) + "/" + spawn.room.energyCapacityAvailable +
                "\nbody parts: [" + blueprint.parts + "]");
        }
        else
        {
            if (status == ERR_NOT_ENOUGH_ENERGY)
            {
                /*console.log("Unable to build creep, cost too high: " + utils.getBodyCost(blueprint.parts) + "/" +
                spawn.room.energyCapacityAvailable + "\nTried to build creep: '" + newName +
                "' at Spawn('" + spawn.name + "')[" + spawn.pos.x + "," + spawn.pos.y + "] in " + spawn.room +
                ", energy cost: " + utils.getBodyCost(blueprint.parts) + "\nbody parts: [" + blueprint.parts + "]");*/
            }
            else
            {
                console.log("Unable to build creep, error code: " + status + "\nTried to build creep: '" + newName +
                "' at Spawn('" + spawn.name + "')[" + spawn.pos.x + "," + spawn.pos.y + "] in " + spawn.room +
                ", energy cost: " + utils.getBodyCost(blueprint.parts) + "\nbody parts: [" + blueprint.parts + "]");
            }
        }
    }
}

module.exports = creepFactory;