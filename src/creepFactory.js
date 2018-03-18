var Utils = require('utils');
var RoleFactory = require('roleFactory');

/// Internal functions

var getPartList = function (minimumParts, partWeights, energyCapacityAvailable, maxParts)
{
    const doDebug = false;

    if (doDebug)
    {
        var initialBodyCost = Utils.getBodyCost(minimumParts);
        console.log("Initial list of parts: [" + minimumParts + "], energy cost: " + initialBodyCost +
        ", extra budget: " + (energyCapacityAvailable - initialBodyCost));
    }

    // Add initial parts to map

    var partMap = {};

    var i, p;
    for (i = 0; i < minimumParts.length; i++)
    {
        var p = minimumParts[i];
        if (partMap.hasOwnProperty(p))
        {
            partMap[p]++;

            if (doDebug)
                console.log("Initial list now has " + partMap[p] + " parts of type " + p);
        }
        else
        {
            partMap[p] = 1;

            if (doDebug)
                console.log("Initial list contains a new part type of " + p);
        }
    }

    // Calculate part weights if found

    var w;
    var totalWeight = 0;
    var totalCostMod = 0;
    for (var type in partWeights)
    {
        w = partWeights[type];
        totalWeight += w;
        totalCostMod += w * Utils.getBodyPartCost(type);

        if (doDebug)
            console.log("Weight of extra part of type : " + type + "(" + (typeof type) + "):" + w);
    }

    if (doDebug)
        console.log("Total weight of extra parts: " + totalWeight + ", cost mod: " + totalCostMod);

    // Find all parts on the extras and the count how many can be added easily

    var totalParts = 0;
    var totalCost = 0;
    var cheapestExtraPartCost = 100000;
    var cheapestExtraPartType = null;

    var min, max;
    for (var type in BODYPART_COST)
    {
        p = 0;
        min = 0;

        if (partMap.hasOwnProperty(type))
        {
            min = partMap[type];

            if (doDebug)
                console.log("Minimum parts of type " + type + ": " + min);
        }

        if (partWeights.hasOwnProperty(type))
        {
            if (cheapestExtraPartType == null || cheapestExtraPartCost > BODYPART_COST[type])
            {
                cheapestExtraPartCost = BODYPART_COST[type];
                cheapestExtraPartType = type;
            }

            w = Number(partWeights[type]);
            i = w * (energyCapacityAvailable / totalCostMod);   // Weighted count
            max = Math.floor(maxParts * w);                     // Absolute maximum of this type
            p = Math.min(Math.floor(i), max);

            if (doDebug)
            {
                console.log("Weighted maximum parts of type " + type + ": " + p +
                    " (weight: " + w + ", max: " + max + "/" + maxParts + ")");
            }
        }

        p = Math.max(min, p);

        if (p > 0)
        {
            totalParts += p;
            totalCost += p * BODYPART_COST[type];
            partMap[type] = p;
        }
    }

    // Fill up any remaining space with weight priorities

    var remainingBudget = energyCapacityAvailable - totalCost

    if (remainingBudget >= cheapestExtraPartCost)
    {
        if (doDebug)
            console.log("Remaining budget for parts: " + remainingBudget + ", cheapest part cost: " + cheapestExtraPartCost);

        // Find the highest weight and add extra
        max = 0.0;
        var selectedType;

        while (remainingBudget >= cheapestExtraPartCost)
        {
            selectedType = null;

            for (var type in partWeights)
            {
                if (BODYPART_COST[type] > remainingBudget)
                    continue;

                w = partWeights[type];
                i = Number(partMap[type]) / totalParts;
                p = w * i;

                if (doDebug)
                {
                    console.log("Extra part " + type + " cost: " + BODYPART_COST[type] + ", weight: " + p +
                        " (" + w + "*" + partWeights[type] + "/" +  totalParts + ")");
                }

                if (i > max)
                {
                    selectedType = type;
                    max = i;
                }
            }

            if (selectedType != null)
            {
                totalParts++;
                partMap[selectedType] = partMap[selectedType] + 1;
                remainingBudget -= BODYPART_COST[selectedType];

                if (doDebug)
                {
                    console.log("Found budget for extra part of type " + selectedType + ", weight: " + max +
                        ", count now: " + partMap[selectedType]);
                }
            }
            else
                break;
        }
    }
    else
    {
        if (doDebug)
        {
            console.log("Cheapest extra part costs " + cheapestExtraPartCost + " but remaining budget " +
                remainingBudget + " doesn't allow it");
        }
    }

    // Finalize the part list

    var partList = [];

    for (var type in partMap)
    {
        p = partMap[type];

        if (p > 0)
        {
            for (i = 1; i <= p; i++)
                partList.push(type);

            if (doDebug)
                console.log("Added " + (i - 1) + "/" + p + " parts of type " + type + "(" + (typeof type) + ")");
        }
    }

    if (doDebug)
            console.log("Final part list: [" + partList + "], cost: " + Utils.getBodyCost(partList));

    return partList;
}

var getBluePrintFromPrototype = function (prototype, energyCapacityAvailable, maxParts)
{
    var blueprint = {};
    blueprint.namePrefix = prototype.roleName;
    blueprint.parts = getPartList(prototype.minimumParts, prototype.partWeightMap, energyCapacityAvailable, maxParts);
    blueprint.cost = Utils.getBodyCost(blueprint.parts);
    blueprint.budget = energyCapacityAvailable;
    blueprint.opts = prototype.opts;

    //console.log("Blueprint: " + Object.keys(blueprint));

    return blueprint;
}

/// Exported object

module.exports = 
{
    getPrototypeByRole: function (role)
    {
        return RoleFactory.getPrototype(role);
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
        var prototype = RoleFactory.getPrototype(role);
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

        var newName = blueprint.namePrefix + "[" + Game.time + "]";

        var status = spawn.spawnCreep(blueprint.parts, newName, blueprint.opts);
        if (status == 0)
        {
            console.log("Building creep: '" + newName + "' at Spawn('" + spawn.name + "')[" + spawn.pos.x + "," + spawn.pos.y + "] in " +
                spawn.room + ", energy cost: " + Utils.getBodyCost(blueprint.parts) + "/" + spawn.room.energyCapacityAvailable +
                "\nbody parts: [" + blueprint.parts + "]");
        }
        else
        {
            if (status == ERR_NOT_ENOUGH_ENERGY)
            {
                /*console.log("Unable to build creep, cost too high: " + Utils.getBodyCost(blueprint.parts) + "/" +
                spawn.room.energyCapacityAvailable + "\nTried to build creep: '" + newName +
                "' at Spawn('" + spawn.name + "')[" + spawn.pos.x + "," + spawn.pos.y + "] in " + spawn.room +
                ", energy cost: " + Utils.getBodyCost(blueprint.parts) + "\nbody parts: [" + blueprint.parts + "]");*/
            }
            else
            {
                console.log("Unable to build creep, error code: " + status + "\nTried to build creep: '" + newName +
                "' at Spawn('" + spawn.name + "')[" + spawn.pos.x + "," + spawn.pos.y + "] in " + spawn.room +
                ", energy cost: " + Utils.getBodyCost(blueprint.parts) + "\nbody parts: [" + blueprint.parts + "]");
            }
        }
    }
}