var Utils = require('utils');
var BodyPartMap = require('creepBodyPartMap');

/// Internal functions

var getPartsToAddPerPart = function(bodyMap, entry, perPartOfType, perPartCount)
{
    const doDebug = false;

    var partsToAdd = [];

    var partsExistNew;
    for (const newPartType in entry)
    {
        partsExist = bodyMap.hasOwnProperty(newPartType) ? bodyMap[newPartType] : 0;
        ratio = partsExist / perPartCount;

        while (ratio < entry[newPartType])
        {
            partsExist++;
            partsToAdd.push(newPartType);
            ratio = partsExist / perPartCount;

            if (doDebug)
            {
                console.log("Body part " + newPartType + " per part " + newPartType + " to " + perPartOfType + " ratio now: " +
                    ratio + " (" + partsExist + "/" +  perPartCount + "), target: " + entry[newPartType]);
            }
        }
    }

    return partsToAdd;
}

var getPartMap = function (minimumParts, partMap, maxCost, maxParts)
{
    const doDebug = false;

    if (!partMap)
        partMap = {};
    if (!Array.isArray(minimumParts))
        minimumParts = [];
    if (maxParts == undefined || maxParts > 50)
        maxParts = 50;
    if (maxCost == undefined)
        maxCost = 300;

    if (doDebug)
    {
        var initialBodyCost = Utils.getBodyCost(minimumParts);
        console.log("Initial list of parts: [" + minimumParts + "], max count " + maxParts + ", energy cost: " + initialBodyCost +
        ", extra budget: " + (maxCost - initialBodyCost) + ", max cost " + maxCost);
    }

    var bodyMap = {};
    var totalCost = 0;
    var totalParts = 0;

    // Add initial parts to map

    var i, p, cost, remainingBudget;
    for (i = 0; i < minimumParts.length; i++)
    {
        if (totalParts >= maxParts)
            break;
        
        p = minimumParts[i];

        remainingBudget = maxCost - totalCost;
        cost = BODYPART_COST[p];

        if (cost > remainingBudget)
            continue;

        if (bodyMap.hasOwnProperty(p))
        {
            bodyMap[p]++;

            if (doDebug)
                console.log("Initial list now has " + bodyMap[p] + " parts of type " + p);
        }
        else
        {
            bodyMap[p] = 1;

            if (doDebug)
                console.log("Initial list contains a new part of type " + p);
        }

        totalParts++;
        totalCost += cost;
    }

    if (doDebug)
    {
        console.log("Current body after minimum part definitions: size: " + totalParts + " / " + maxParts +
            ", cost: " + totalCost + " / " + maxCost + "\nMap: " + JSON.stringify(bodyMap));
    }

    // Group part map definitions by types

    var weightsTotal = 0.0;
    var weightedDefinitions = {};
    var atLeastDefinitions = {};
    var perPartDefinitions = {};
    var perOtherPartDefinitions = {};

    var entry;

    for (const t in partMap)
    {
        entry = partMap[t];

        switch (entry.type)
        {
            case BodyPartMap.Type.AtLeast:
                atLeastDefinitions[t] = entry;
                break;
            case BodyPartMap.Type.Weight:
                weightsTotal += entry.value;
                weightedDefinitions[t] = entry;
                break;
            case BodyPartMap.Type.PerOtherPart:
                perOtherPartDefinitions[t] = entry;
                if (doDebug)
                {
                    console.log("Added per other part type definition: Body parts of any type need " +
                        entry.value + " parts of type " + t);
                }
                break;
            case BodyPartMap.Type.PerPartOfType:
                if (entry.opts.part == undefined)
                {
                    if (doDebug)
                        console.log("BodyPartMap entry of type " + BodyPartMap.getNameOf(entry.type) + " has no part type defined!");
                }
                else
                {
                    if (!perPartDefinitions.hasOwnProperty(entry.opts.part))
                        perPartDefinitions[entry.opts.part] = {};
                    
                    perPartDefinitions[entry.opts.part][t] = entry.value;
                    
                    if (doDebug)
                    {
                        console.log("Added per part type definition: Body part type " + entry.opts.part +
                            " needs " + entry.value + " parts of type " + t);
                    }
                }
                break;
        }
    }

    // Add any per part entries on top of the minimums

    var partsToAdd;

    if (Object.keys(perPartDefinitions).length > 0)
    {
        for (const t in perPartDefinitions)
        {
            entry = perPartDefinitions[t];

            if (doDebug)
            {
                console.log("* Additional parts of type " + entry.opts.part + " defined per " + t +
                    " part. Target ratio: " + entry.value);
            }
                    
            if (!bodyMap.hasOwnProperty(t))
                continue;

            partsToAdd = getPartsToAddPerPart(bodyMap, entry, t, bodyMap[t]);

            for (i = 0; i < partsToAdd.length; i++)
            {
                remainingBudget = maxCost - totalCost;
                p = partsToAdd[i];

                cost = BODYPART_COST[p];
                if (cost > remainingBudget)
                    continue;

                totalParts++;
                totalCost += cost;
                bodyMap[p]++;

                if (doDebug)
                    console.log("Per part type: Part map contains " + bodyMap[p] + " part(s) of type " + p);

                if (totalParts >= maxParts || totalCost >= maxCost)
                    break;
            }

            if (totalParts >= maxParts || totalCost >= maxCost)
                break;
        }
    }

    if (Object.keys(perOtherPartDefinitions).length > 0)
    {
        var ratio, existingParts; extraParts;
        for (const b in perOtherPartDefinitions)
        {
            entry = perOtherPartDefinitions[b];

            if (doDebug)
                console.log("* Additional parts of type " + b + " defined per any other part. Ratio: " + entry.value);

            remainingBudget = maxCost - totalCost;

            cost = 0;
            extraParts = 0;
            existingParts = bodyMap.hasOwnProperty(b) ? bodyMap[b] : 0;

            ratio = bodyMap[b] / (totalParts - existingParts);

            while (ratio < entry.value && totalParts + extraParts < maxParts)
            {
                cost += BODYPART_COST[b];
                if (cost > remainingBudget)
                    break;

                extraParts++;
                ratio = (extraParts + bodyMap[b]) / (totalParts - existingParts);

                if (doDebug)
                {
                    console.log("Going to add body part " + b + ", ratio now: " + ratio +
                        " (" + (extraParts + bodyMap[b]) + "/" + (totalParts - existingParts) +
                        "), target: " + entry.value);
                }
            }

            if (extraParts > 0)
            {
                totalCost += extraParts * BODYPART_COST[b];
                totalParts += extraParts;
                bodyMap[b] += extraParts;

                if (doDebug)
                    console.log("Per other part: Part map now has " + bodyMap[b] + " part(s) of type " + b);

                if (totalParts >= maxParts || totalCost >= maxCost)
                    break;
            }
        }
    }

    // Done adding per part definitions on top of minimum part map

    if (doDebug)
    {
        console.log("Current body after minimum per part map definitions: size: " + totalParts + " / " + maxParts +
            ", cost: " + totalCost + " / " + maxCost + "\nMap: " + JSON.stringify(bodyMap));
    }

    // Apply all atLeast type part map definitions taking into account any per part definitions

    if (Object.keys(atLeastDefinitions).length > 0)
    {
        for (const t in atLeastDefinitions)
        {
            if (totalParts >= maxParts)
                break;

            entry = atLeastDefinitions[t];
            
            if (bodyMap.hasOwnProperty(t) && bodyMap[t] >= entry.value)
                continue;
            else
                bodyMap[t] = 0;

            var loopCount = 0;
            cost = BODYPART_COST[t];
            while (bodyMap[t] < entry.value && totalParts < maxParts && totalCost < maxCost)
            {
                loopCount++;
                if (loopCount >= maxParts)
                {
                    console.log("AtLeast definitions loop count limit " + maxParts + " exceeded!");
                    break;
                }

                remainingBudget = maxCost - totalCost;

                // Add per part type definitions

                partsToAdd = [];
                if (perPartDefinitions.hasOwnProperty(t))
                {
                    if (doDebug)
                    {
                        console.log("** Additional parts of type " + perPartDefinitions[t].opts.part + " defined per " + t +
                            " part. Target ratio: " + perPartDefinitions[t].value);
                    }

                    partsToAdd = getPartsToAddPerPart(bodyMap, perPartDefinitions[t], t, bodyMap[t]);

                    if (doDebug)
                        console.log("Going to add " + partsToAdd.length + " parts of type " + perPartDefinitions[t].opts.part);
                }

                // Add per other part definitions too

                if (Object.keys(perOtherPartDefinitions).length > 0)
                {
                    var extraParts;
                    for (const b in perOtherPartDefinitions)
                    {
                        extraParts = 0;
                        var partEntry = perOtherPartDefinitions[b];

                        if (doDebug)
                            console.log("** Additional parts of type " + b + " defined per any other part. Ratio: " + partEntry.value);

                        for (const a in bodyMap)
                        {
                            if (a == b)
                                continue;

                            ratio = bodyMap[b] / bodyMap[a];

                            while (ratio < partEntry.value)
                            {
                                extraParts++;
                                ratio = (extraParts + bodyMap[b]) / bodyMap[a];

                                if (doDebug)
                                {
                                    console.log("Body part " + b + " per part " + a + " ratio now: " +
                                        ratio + ", target: " + partEntry.value);
                                }
                            }

                            if (totalParts + extraParts >= maxParts || totalCost >= maxCost)
                                break;
                        }

                        for (i = 0; i < extraParts; i++)
                            partsToAdd.push(b);

                        if (doDebug)
                            console.log("Going to add " + extraParts + " parts of type " + b);

                        if (totalParts >= maxParts || totalCost >= maxCost)
                            break;
                    }
                }

                if (totalParts + 1 + partsToAdd.length > maxParts)
                {
                    if (doDebug)
                    {
                        console.log("Part of type " + t + " can't be added due to accompanied per part type parts " + partsToAdd +
                            " would go over part limit: " + (totalParts + 1 + partsToAdd.length) + " > " + maxParts + "!");
                    }

                    continue;
                }
                
                for (i = 0; i < partsToAdd.length; i++)
                {
                    p = partsToAdd[i];
                    cost += BODYPART_COST[p];
                }
                
                if (cost > remainingBudget)
                {
                    if (doDebug)
                    {
                        console.log("Part of type " + t + " can't be added due to accompanied parts " + partsToAdd +
                            " would go over cost limit: " + (totalCost + cost) + " > " + maxCost + "!");
                    }

                    continue;
                }
                    
                totalParts += partsToAdd.length;

                for (i = 0; i < partsToAdd.length; i++)
                {
                    p = partsToAdd[i];
                    totalCost += BODYPART_COST[p];
                    bodyMap[p]++;

                    if (doDebug)
                        console.log("Part map now has " + bodyMap[p] + " part(s) of type " + p);
                }

                if (totalParts >= maxParts || totalCost >= maxCost)
                    break;

                if (doDebug)
                    console.log("Part map now has " + bodyMap[t] + " part(s) of type " + t);
            }
        }

        if (doDebug)
        {
            console.log("Current body after atLeast part map definitions: size: " + totalParts + " / " + maxParts +
                ", cost: " + totalCost + " / " + maxCost + "\nMap: " + JSON.stringify(bodyMap));
        }
    }

    // Apply the weighted part map definitions

    if (Object.keys(weightedDefinitions).length > 0)
    {
        var loopCount = 0;
        var discardedSelectedType = null;
        var weight, highestWeight, selectedType;
        while (totalCost < maxCost && totalParts < maxParts)
        {
            loopCount++;
            if (loopCount >= maxParts)
            {
                console.log("Weight definitions loop count limit " + maxParts + " exceeded!");
                break;
            }

            remainingBudget = maxCost - totalCost;
            selectedType = null;
            highestWeight = 0.0;

            for (const t in weightedDefinitions)
            {
                entry = weightedDefinitions[t];
                cost = BODYPART_COST[t];

                if (!bodyMap.hasOwnProperty(t))
                    bodyMap[t] = 0;

                p = bodyMap[t] / totalParts;
                weight = (weightsTotal > 0.0 ? entry.value / weightsTotal : 1.0) - p;

                if (doDebug)
                {
                    console.log("Body part " + t + " cost: " + cost + ", weight: " + weight +
                        " (" + entry.value + "/" + weightsTotal + " - (" + bodyMap[t] + "/" +  totalParts + "))");
                }

                if (cost > remainingBudget)
                {
                    if (doDebug)
                        console.log("Part cost too high, remaining budget: " + remainingBudget);

                    continue;
                }

                if (weight > highestWeight)
                {
                    selectedType = t;
                    highestWeight = weight;
                }
            }

            if (selectedType == null)
            {
                if (doDebug)
                    console.log("No weighted body part type selected, considering body map done!");

                break;
            }
            else if (discardedSelectedType != null && selectedType == discardedSelectedType)
            {
                if (doDebug)
                    console.log("Selected a previously discarded body part type " + selectedType + ", considering body map done!");

                break;
            }

            cost = BODYPART_COST[selectedType];

            if (doDebug)
                console.log("Body part " + selectedType + " chosen, remaining budget: " + remainingBudget);

            // Add part per part of certain type definitions on top of weighted part

            if (perPartDefinitions.hasOwnProperty(selectedType))
            {
                if (doDebug)
                {
                    console.log("*** Additional parts of type " + perPartDefinitions[t].opts.part + " defined per " + selectedType +
                        " part. Ratio: " + perPartDefinitions[selectedType].value);
                }

                partsToAdd = getPartsToAddPerPart(bodyMap, perPartDefinitions[selectedType], selectedType, 1 + bodyMap[selectedType]);
            }
            else
                partsToAdd = [];

            // Add per other part definitions on top of weighted part

            if (Object.keys(perOtherPartDefinitions).length > 0)
            {
                var extraParts;
                for (const b in perOtherPartDefinitions)
                {
                    var partEntry = perOtherPartDefinitions[b];

                    if (doDebug)
                        console.log("*** Additional parts of type " + b + " defined per any other part. Ratio: " + partEntry.value);

                    extraParts = 0;
                    existingParts = bodyMap.hasOwnProperty(b) ? bodyMap[b] : 0;

                    ratio = bodyMap[b] / (1 + totalParts - existingParts);

                    while (ratio < partEntry.value && totalParts + extraParts < maxParts)
                    {
                        extraParts++;
                        ratio = (extraParts + bodyMap[b]) / (1 + totalParts - existingParts);

                        if (doDebug)
                        {
                            console.log("Going to add body part " + b + ", ratio now: " + ratio +
                                " (" + (extraParts + bodyMap[b]) + "/" + (1 + totalParts - existingParts) +
                                "), target: " + partEntry.value);
                        }
                    }

                    if (extraParts > 0)
                    {
                        for (i = 0; i < extraParts; i++)
                            partsToAdd.push(b);
                    }
                }
            }

            if (1 + totalParts + partsToAdd.length > maxParts)
            {
                if (doDebug)
                {
                    console.log("Part of type " + selectedType + " can't be added due to accompanied parts " + partsToAdd +
                        " would go over part limit: " + (1 +totalParts +  partsToAdd.length) + " > " + maxParts + "!");
                }

                discardedSelectedType = selectedType;
                continue;
            }
            
            for (i = 0; i < partsToAdd.length; i++)
            {
                p = partsToAdd[i];
                cost += BODYPART_COST[p];
            }
            
            if (cost > remainingBudget)
            {
                if (doDebug)
                {
                    console.log("Part of type " + selectedType + " can't be added due to accompanied parts " + partsToAdd +
                        " price " + cost + " would go over cost limit: " + (totalCost + cost) + " > " + maxCost + "!");
                }

                discardedSelectedType = selectedType;
                continue;
            }

            totalParts += partsToAdd.length;  

            for (i = 0; i < partsToAdd.length; i++)
            {
                p = partsToAdd[i];
                bodyMap[p]++;

                if (doDebug)
                    console.log("Part map now has " + bodyMap[p] + " part(s) of type " + p);
            }

            totalCost += cost;
            totalParts++;
            bodyMap[selectedType]++;

            if (doDebug)
            {
                console.log("Part map now has " + bodyMap[selectedType] + " part(s) of type " + selectedType + "\nBody size: " +
                    totalParts + " / " + maxParts + ", cost: " + totalCost + " / " + maxCost + ", map: " + JSON.stringify(bodyMap));
            }
        }

        if (doDebug)
        {
            console.log("Current body after weighted part map definitions: size: " + totalParts + " / " + maxParts +
                ", cost: " + totalCost + " / " + maxCost + "\nMap: " + JSON.stringify(bodyMap));
        }
    }

    if (doDebug)
    {
        console.log("Final body: size: " + totalParts + " / " + maxParts +
            ", cost: " + totalCost + " / " + maxCost + "\nMap: " + JSON.stringify(bodyMap));
    }

    return bodyMap;
}

var getBluePrintFromPrototype = function (prototype, maxBodySize)
{
    var blueprint = {};
    blueprint.namePrefix = prototype.roleName;
    blueprint.partMap = prototype.partMap;

    if (maxBodySize != undefined)
        blueprint.maxBodySize = maxBodySize;

    if (Array.isArray(prototype.minimumParts))
        blueprint.minimumParts = prototype.minimumParts;

    blueprint.opts = prototype.opts != null ? prototype.opts : {};

    //console.log("Blueprint: " + Object.keys(blueprint));

    return blueprint;
}

/// Exported object

module.exports = 
{
    buildPartList: function (minimumParts, partMap, maxParts)
    {
        return this.buildPartListFromMap(getPartMap(minimumParts, partMap, energyBudget, maxParts));
    },

    buildPartListFromMap: function(partMap)
    {
        var partList = [];

        var type;
        for (var b = 0; b < BODYPARTS_ALL.length; b++)
        {
            type = BODYPARTS_ALL[b];

            if (!partMap.hasOwnProperty(type))
                continue;

            for (var i = 0; i < partMap[type]; i++)
                partList.push(type);
        }

        return partList;
    },

    buildBlueprintFromPrototype: function (prototype, maxParts)
    {
        return getBluePrintFromPrototype(prototype, maxParts);
    },

    buildBlueprintFromRole: function (role, maxParts)
    {
        var prototype = Game.empire.factories.role.getPrototype(role);
        if (prototype != undefined && prototype != null)
        {
            //console.log("Prototype[" + role + "]: " + prototype.roleName + "(" + (typeof prototype) + ")");
            return getBluePrintFromPrototype(prototype, maxParts);
        }

        console.log("No prototype found for role " + role);
        return null;
    },

    createSpawnOrder: function(id, priority, blueprint, opts)
    {
        var order = { id:id, time:Game.time, priority:priority };

        if (Array.isArray(blueprint.parts))
            order.cost = Utils.getBodyCost(blueprint.parts);
        else if (opts != null)
        {
            order.minCost = opts.minCost != undefined ? opts.minCost : 300;
            if (opts.maxCost != undefined)
                order.maxCost = opts.maxCost;
        }

        order.blueprint = blueprint;

        return order;
    },

    addBlueprintToSpawnQueue: function(spawn, id, priority, blueprint, maxCost)
    {
        if (blueprint == null)
            return;

        if (spawn.memory.spawnQueue == null)
            spawn.memory.spawnQueue = {};

        if (spawn.memory.spawnQueue.hasOwnProperty(id))
        {
            console.log("Spawn('" + spawn.name + "') " + spawn.pos +
                ", already contained blueprint with id " + id + ", replacing!");
        }
        var opts = { maxCost:(maxCost != undefined ? maxCost : spawn.room.energyCapacityAvailable) };
        spawn.memory.spawnQueue[id] = this.createSpawnOrder(id, priority, blueprint, opts);

        console.log("Added a creep blueprint " + id + " at priority " + priority + " to queue at Spawn('" + spawn.name +
            "')" + spawn.pos + "\n" + JSON.stringify(blueprint));
    },

    getEntryFromSpawnQueue: function(spawn)
    {
        if (!spawn.memory.spawnQueue)
            return null;

        var entry;
        var highestPriority = 0;
        var chosenEntry = null;
        for (var id in spawn.memory.spawnQueue)
        {
            entry = spawn.memory.spawnQueue[id];
            if (entry.priority == undefined)
            {
                console.log("Spawn queue entry " + id + " has no priority defined!");
                continue;
            }

            if (entry.priority > highestPriority)
            {
                chosenEntry = entry;
                highestPriority = entry.priority;
            }
        }
        
        //console.log("Peeked from spawn queue, got blueprint:\n" + JSON.stringify(chosenEntry));
        return chosenEntry;
    },

    tryRemoveEntryFromSpawnQueue: function(spawn, id)
    {
        if (!spawn.memory.spawnQueue || !spawn.memory.spawnQueue.hasOwnProperty(id))
            return false;

        delete spawn.memory.spawnQueue[id];
        
        //console.log("Removed entry " + id + " from spawn queue, " +
        //  Object.keys(spawn.memory.spawnQueue).length + " entrie(s) remain");

        return true;
    },

    tryBuildCreepFromBlueprint: function (spawn, blueprint, maxCost)
    {
        if (!blueprint)
        {
            console.log("Invalid blueprint provided: " + blueprint);
            return false;
        }

        if (!spawn)
        {
            console.log("Invalid Spawn provided: " + spawn + ", can't build blueprint:\n" + JSON.stringify(blueprint));
            return false;
        }

        console.log("Trying to build from blueprint: " + JSON.stringify(blueprint));

        var newName = blueprint.namePrefix + "[" + Game.time + "]";

        if (maxCost == undefined)
            maxCost = spawn.room.energyCapacityAvailable;

        var partList = [];
        if (Array.isArray(blueprint.parts))
            partList = blueprint.parts;
        else if (blueprint.partMap != null)
        {
            var partMap = getPartMap(blueprint.minimumParts, blueprint.partMap, maxCost, blueprint.maxBodySize);
            partList = this.buildPartListFromMap(partMap);

            console.log("Part map " + JSON.stringify(partMap) + " converted into a list:\n" + partList);
        }

        var status = spawn.spawnCreep(partList, newName, blueprint.opts);
        if (status == 0)
        {
            console.log("Building creep: '" + newName + "' at Spawn('" + spawn.name + "')[" + spawn.pos.x + "," + spawn.pos.y + "] in " +
                spawn.room + ", energy cost: " + Utils.getBodyCost(partList) + "/" + maxCost +
                "\nBlueprint: " + JSON.stringify(blueprint) + "\nParts: " + partList);

            return true;
        }
        else
        {
            if (status == ERR_NOT_ENOUGH_ENERGY)
            {
                console.log("Unable to build creep, cost too high: " + Utils.getBodyCost(partList) + "/" +
                    spawn.room.energyAvailable + "\nTried to build creep: '" + newName +
                    "' at Spawn('" + spawn.name + "') in " + spawn.pos + ", energy cost: " + Utils.getBodyCost(partList) +
                    "/" + maxCost + "\nBlueprint: " + JSON.stringify(blueprint) + "\nParts: " + partList);
            }
            else
            {
                console.log("Unable to build creep, error code: " + status + "\nTried to build creep: '" + newName +
                    "' at Spawn('" + spawn.name + "') in " + spawn.pos + ", energy cost: " + Utils.getBodyCost(partList) +
                    "/" + maxCost + "\nBlueprint: " + JSON.stringify(blueprint) + "\nParts: " + partList);
            }
        }

        return false;
    }
}