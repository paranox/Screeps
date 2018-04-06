var Utils = require('utils');
var Operation = require('operationTypes');
var OperationBase = require('operationBase');
var Role = require('roleTypes');
var Job = require('jobTypes');

function Home(opts)
{
	//console.log("OperationBase->Home.constructor(opts: " + JSON.stringify(opts) + ")");
    this.opType = Operation.Type.Home;
	this.opName = Operation.getNameOf(this.opType);
	
    this.base = OperationBase;
    this.base.constructor(this, opts);

	this.home.roomLevel = 0;
}

/// Memory functions, should always be called via context's override
/// NOTE: These require a context reference and are usually

Home.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data != null)
	{
		if (data.home != null)
		{
			if (data.home.roomLevel != undefined)
				this.home.roomLevel = data.home.roomLevel;
		}
	}

	return true;
}

Home.prototype.writeSaveData = function()
{
	var data = this.base.writeSaveData(this);
	
	data.home.roomLevel = this.home.roomLevel;

    if (this.home.reserves)
    {
        if (!data.home.reserves)
        {
            console.log("Operation " + this.opName + "[" + this.id + "]: Initializing reserves data!");
            data.home.reserves = { stores:{} };
        }

        data.home.reserves.resources = this.home.reserves.resources;

        if (!data.home.reserves.stores)
        {
            console.log("Operation " + this.opName + "[" + this.id + "]: Initializing reserve stores data!");
            data.home.reserves.stores = {};
        }

        var storeObject, storeData;
        for (var i = 0; i < this.home.reserves.stores.length; i++)
        {
            storeObject = this.home.reserves.stores[i];

            if (!storeObject)
                continue;

            if (!data.home.reserves.stores[storeObject.id])
            {
                console.log("Operation " + this.opName + "[" + this.id + "]: New store object found: " + storeObject);
                storeData = { type:storeObject.structureType, priority:1.0, resources:{} };
                data.home.reserves.stores[storeObject.id] = storeData;
            }
            else
                storeData = data.home.reserves.stores[storeObject.id];

            if (storeObject.energy)
            {
                storeData.resources[RESOURCE_ENERGY] = storeObject.energy;
                storeData.resources.capacity = storeObject.energy / storeObject.energyCapacity;
            }
            else if (storeObject.store)
            {
                var sum = 0;
                for (const res in storeObject.store)
                {
                    sum += storeObject.store[res];
                    storeData.resources[res] = storeObject.store[res];
                }

                storeData.resources.capacity = sum / storeObject.storeCapacity;
            }
        }
    }

	return data;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

Home.prototype.getConstructorOptsHelpString = function()
{
    return OperationBase.getConstructorOptsHelpString();
}

Home.prototype.onUpdate = function()
{
    // Make sure we're not losing vital roles
    if (this.home.spawnOrdersPlaced && this.home.spawn.memory.spawnQueue)
    {
        var spawnQueueEntry, roleType;
        for (const id in this.home.spawnOrdersPlaced)
        {
            spawnQueueEntry = this.home.spawn.memory.spawnQueue[id];
            roleType = -1;

            if (!spawnQueueEntry)
                continue;

            if (spawnQueueEntry.role)
                roleType = Role.Type[spawnQueueEntry.role];
            else if (spawnQueueEntry.blueprint.opts.memory.role)
                roleType = Role.Type[spawnQueueEntry.blueprint.opts.memory.role];

            if (roleType >= 0)
            {
                if ((roleType == Role.Type.Supplier || roleType == Role.Type.Harvester) && this.roles[roleType])
                {
                    //console.log("Spawn queue has an order for role " + roleType + " (" + Role.getNameOf(roleType) +
                    //    ") and there's currently " + this.roles[roleType].current + " actors of that role enlisted");

                    if (this.roles[roleType].current < this.roles[roleType].min)
                    {
                        var newMinCost = 300;
                        var rolePrototype = Game.empire.factories.role.getPrototype(roleType);
                        if (rolePrototype != null && rolePrototype.minimumParts)
                            newMinCost = Utils.getBodyCost(rolePrototype.minimumParts);

                        if (spawnQueueEntry.minCost > newMinCost)
                        {
                            spawnQueueEntry.minCost = newMinCost;

                            console.log("Vital spawn order for " + roleType + " (" + Role.getNameOf(roleType) +
                                ") has too few current actors enlisted " + this.roles[roleType].current + " < " +
                                this.roles[roleType].min + ", set minimum cost to " + spawnQueueEntry.minCost);
                        }
                    }
                }
            }
            else
                console.log("Unhandled or undefined roleType " + roleType + " on spawn order " + id);
        }
    }

    this.roomUpdate();
    this.spawnUpdate();
}

Home.prototype.roomUpdate = function()
{
    if (!this.home.room)
    {
        console.log("Operation " + this.opName + "[" + this.id + "]: Unable to find home room!");
        return;
    }

    this.home.roomLevel = this.home.room.controller.level;

    this.home.reserves = { resources:{} };
    this.home.reserves.stores = this.home.room.find(FIND_STRUCTURES, { filter: (structure) =>
            { return structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE ||
                     structure.structureType == STRUCTURE_LINK } });

    var storeStructure, resource;
    for (var i = 0; i < this.home.reserves.stores.length; i++)
    {
        storeStructure = this.home.reserves.stores[i];

        if (this.doDebug)
            console.log("Found resource store structure: " + storeStructure);

        for (const type in storeStructure.store)
        {
            resource = storeStructure.store[type];

            if (resource < 1)
                continue;

            if (!this.home.reserves.resources.hasOwnProperty(type))
                this.home.reserves.resources[type] = resource;
            else
                this.home.reserves.resources[type] += resource;
        }
    }

    if (this.doDebug)
    {
        for (const type in this.home.reserves.resources)
            console.log("Resource " + type + " reserves now at: " + this.home.reserves.resources[type]);
    }

    if (Memory.empire.operations[this.id])
    {
        var memoryData = Memory.empire.operations[this.id];
        if (memoryData.home && memoryData.home.reserves && memoryData.home.reserves.stores)
        {
            for (var i = 0; i < this.home.reserves.stores.length; i++)
            {
                storeStructure = this.home.reserves.stores[i];

                if (!storeStructure)
                    continue;

                if (storeStructure.structureType == STRUCTURE_LINK)
                {
                    if (memoryData.home.reserves.stores[storeStructure.id])
                    {
                        var storeData = memoryData.home.reserves.stores[storeStructure.id];
                        if (storeData.linkTransferFrom)
                        {
                            var source = Game.getObjectById(storeData.linkTransferFrom);
                            if (source)
                            {
                                var amount = Math.floor((storeStructure.energyCapacity - storeStructure.energy) / 0.97);
                                source.transferEnergy(storeStructure, Math.min(source.energy, amount));
                            }
                        }
                    }
                }
            }
        }
    }

    // Crappy old tower behaviour

    var towers = this.home.room.find(FIND_STRUCTURES,
        { filter: (structure) => { return structure.structureType == STRUCTURE_TOWER && structure.energy > 0; } });

    if (towers.length > 0)
    {
        var tower, closestHostile;
        for (var i = 0; i < towers.length; i++)
        {
            /*var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, 
                { filter: (structure) => structure.hits < structure.hitsMax });

            if (closestDamagedStructure != null)
                tower.repair(closestDamagedStructure);*/

            tower = towers[i];
            closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

            if (closestHostile != null)
            {
                console.log("Operation " + this.opName + "[" + this.id + "]: Alert! Tower at " + tower.pos +
                    " attacking hostile at " + closestHostile.pos);

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
    }
}

Home.prototype.spawnUpdate = function()
{
    var spawn = this.home.spawn;
    if (!spawn)
    {
        console.log("Operation " + this.opName + "[" + this.id + "]: Unable to find home spawn!");
        return;
    }

    if (!spawn.memory.spawnQueue || Array.isArray(spawn.memory.spawnQueue))
    {
        console.log("Operation " + this.opName + "[" + this.id + "]: Initializing spawn queue!");
        spawn.memory.spawnQueue = {};
    }

    if (this.home.room.name != spawn.room.name)
        return;

    this.roomVisual = new RoomVisual(spawn.room.name);

    if (spawn.spawning)
    {
        if (this.roomVisual)
        {
            let percentage = Math.floor(100.0 * (1 - (spawn.spawning.remainingTime / spawn.spawning.needTime)));
            let text = "Spawning " + percentage + "%";
            this.roomVisual.text(text, spawn.pos.x, spawn.pos.y + 1.3, { font:0.5, stroke:"#000000" });
            this.roomVisual.text(spawn.spawning.name, spawn.pos.x, spawn.pos.y + 2, { font:0.5, stroke:"#000000" });
            this.roomVisual.text("Orders remain: " + Object.keys(spawn.memory.spawnQueue).length,
                spawn.pos.x, spawn.pos.y + 2.7, { font:0.5, stroke:"#000000" });
        }

        //console.log("Spawn " + spawn.name + " is spawning: " + Utils.objectToString(spawn.spawning, 0, 2));
        return;
    }
    else if (spawn.memory.spawning != null)
    {
        console.log("Operation " + this.opName + "[" + this.id + "]: Spawn " + spawn.name +
            " is done spawning: " + Utils.objectToString(spawn.memory.spawning, 0, 2));

        spawn.memory.spawning = null;
    }

    const energyAvailable = spawn.room.energyAvailable;
    const energyCapacity = spawn.room.energyCapacityAvailable;

    var spawnQueueEntry = Game.empire.factories.creep.getOrderFromSpawnQueue(spawn);
    if (spawnQueueEntry != null)
    {
        if (this.roomVisual)
        {
            this.roomVisual.text("Next Order: " + spawnQueueEntry.id, spawn.pos.x, spawn.pos.y + 1.3, { font:0.5, stroke:"#000000" });
            this.roomVisual.text("Priority: " + spawnQueueEntry.priority, spawn.pos.x, spawn.pos.y + 2, { font:0.5, stroke:"#000000" });
        }

        //var chosenQueueID = null;
        //var chosenBlueprint = null;
        //
        //if (spawnQueueEntry.allowUpdate == true && energyAvailable > spawnQueueEntry.cost)
        //{
        //    console.log("Energy capacity, and stored energy, have increased since creating blueprint:\n" +
        //      JSON.stringify(spawnQueueEntry));
        //    
        //    spawnQueueEntry.blueprint =
        //        Game.empire.factories.creep.buildBlueprintFromRole(spawnQueueEntry.opts.memory.role);
        //        
        //    console.log("Created new blueprint:\n" + JSON.stringify(chosenBlueprint));
        //}
        //
        //chosenBlueprint = spawnQueueEntry.blueprint;
        //chosenQueueID = spawnQueueEntry.id;

        this.roomVisual.text("Orders remain: " + Object.keys(spawn.memory.spawnQueue).length,
            spawn.pos.x, spawn.pos.y + 3.4, { font:0.5, stroke:"#000000" });

        if (spawnQueueEntry != null)
        {
            if (spawnQueueEntry.cost > energyAvailable)
            {
                if (this.doDebug)
                {
                    console.log("Operation " + this.opName + "[" + this.id + "]: Blueprint cost " + spawnQueueEntry.cost +
                        " is higher than available energy " + energyAvailable + ", waiting...");
                }

                if (this.roomVisual)
                {
                    this.roomVisual.text("Cost: " + spawnQueueEntry.cost + " > " + energyAvailable,
                        spawn.pos.x, spawn.pos.y + 2.7, { font:0.5 });
                }

                return;
            }

            var minCost = 300;
            if (spawnQueueEntry.minCost)
                minCost = spawnQueueEntry.minCost;
            if (spawnQueueEntry.blueprint.minimumParts)
            {
                var cost = Utils.getBodyCost(spawnQueueEntry.blueprint.minimumParts);
                if (cost > minCost)
                    minCost = cost;
            }

            // If the minimum cost of the order can't be met, keep waiting
            if (energyAvailable < minCost)
            {
                if (this.doDebug)
                {
                    console.log("Operation " + this.opName + "[" + this.id + "]: Blueprint minimum cost " +
                        minCost + " is higher than available energy " + energyAvailable + ", waiting...");
                }

                if (this.roomVisual)
                {
                    this.roomVisual.text("MinCost: " + minCost + " > " + energyAvailable,
                        spawn.pos.x, spawn.pos.y + 2.7, { font:0.5, stroke:"#000000" });
                }

                return;
            }

            var maxCost = energyAvailable;
            if (spawnQueueEntry.maxCost && spawnQueueEntry.maxCost < maxCost)
                maxCost = spawnQueueEntry.maxCost;
            if (maxCost < minCost)
                maxCost = minCost;

            var newName = spawnQueueEntry.id + "[" + Game.time + "]";
            var partList = Game.empire.factories.creep.buildPartListFromBlueprint(spawnQueueEntry.blueprint, minCost, maxCost);

            // If a part list wasn't possible to build from min/max cost limitations, keep waiting
            if (!partList || partList.length == 0)
            {
                if (this.doDebug)
                {
                    console.log("Operation " + this.opName + "[" + this.id + "]: Body not possible within cost limitations! Min/Max: " +
                        minCost + "/" + maxCost);
                }

                if (this.roomVisual)
                {
                    this.roomVisual.text("No body possible: " + minCost + " <-> " + maxCost,
                        spawn.pos.x, spawn.pos.y + 2.7, { font:0.5, stroke:"#000000" });
                }

                return;
            }

            var actualCost = Utils.getBodyCost(partList);

            // If the cost of the part list is too high, keep waiting
            if (energyAvailable < actualCost)
            {
                if (this.doDebug)
                {
                    console.log("Operation " + this.opName + "[" + this.id + "]: Blueprint minimum cost " +
                        minCost + " is higher than available energy " + energyAvailable + ", waiting...");
                }

                if (this.roomVisual)
                {
                    this.roomVisual.text("Cost: " + actualCost + " > " + energyAvailable,
                        spawn.pos.x, spawn.pos.y + 2.7, { font:0.5, stroke:"#000000" });
                }

                return;
            }

            console.log("Operation " + this.opName + "[" + this.id + "]: Trying to build spawn order " + spawnQueueEntry.id +
                ", priority: " + spawnQueueEntry.priority + "\n" + JSON.stringify(spawnQueueEntry));

            if (Game.empire.factories.creep.tryBuildCreep(spawn, newName, partList, spawnQueueEntry.blueprint.opts))
            {
                spawn.memory.spawning = spawnQueueEntry;

                var orderForOp = spawnQueueEntry.blueprint.opts.memory.operationID;
                if (orderForOp)
                {
                    var op = Game.empire.operations[orderForOp];
                    if (op)
                    {
                        op.doDebug = true;
                        
                        console.log("Operation " + this.opName + "[" + this.id + "]: Adding Creep " + newName +
                            " ordered by " + orderForOp + " to Operation " + op.opName + "[" + op.id + "]");

                        op.modifyRoleActorCount(Role.Type[spawnQueueEntry.blueprint.opts.memory.role], 1);

                        op.doDebug = false;
                    }
                }

                let result = Game.empire.factories.creep.tryRemoveOrderFromSpawnQueue(spawn, spawnQueueEntry.id);
                if (!result)
                {
                    console.log("Operation " + this.opName + "[" + this.id + "]: Unable to remove entry " +
                        spawnQueueEntry.id + " from spawn queue!");
                }
            }
        }
    }
}

Home.prototype.getJob = function(actor)
{
    if (actor.creep.room.name != this.home.room.name)
    {
        //console.log("Operation " + this.opName + "[" + this.id + "]: Creep " + actor.creep.name +
        //    " not in the correct room " + actor.creep.room + ", ordering it to return home to " + this.home.room + "!");

        return Game.empire.factories.job.createFromType(Job.Type.MoveTo, { target:this.home.room });
    }

    if (actor.role.roleType == Role.Type.Supplier)
    {
        var targets = [];
        var chosenTarget = null;

        // Find which spawn or extension to supply
        if (actor.creep.carry.energy > 0)
        {
            targets = this.home.room.find(FIND_STRUCTURES,
            {
                filter: (structure) =>
                {
                    if (!structure.my)
                        return false;

                    if (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN)
                        return structure.energy < structure.energyCapacity;

                    return false;
                }
            });

            //console.log("Operation " + this.opName + "[" + this.id + "]: Creep " + actor.creep.name +
            //    ": Found " + targets.length + " Supply targets: " + targets);

            chosenTarget = actor.creep.pos.findClosestByPath(targets);

            if (chosenTarget)
            {
                //console.log("Operation " + this.opName + "[" + this.id + "]: Creep " + actor.creep.name +
                //    ": Supplying " + chosenTarget + " at " + chosenTarget.pos);

                return Game.empire.factories.job.createFromType(Job.Type.Supply, { for:actor.creep.name, target:chosenTarget });
            }
        }

        if (this.home.reserves.stores && this.home.reserves.stores.length > 0)
        {
            targets = this.home.reserves.stores.filter((structure) =>
                {
                    if (structure.energy)
                        return structure.energy > 0;
                    if (structure.store)
                        return structure.store[RESOURCE_ENERGY] > 0;

                    return false;
                });
        }
        else
        {
            targets = this.home.room.find(FIND_STRUCTURES,
            {
                filter: (structure) =>
                {
                    if (structure.structureType == STRUCTURE_CONTAINER ||
                        structure.structureType == STRUCTURE_STORAGE ||
                        structure.structureType == STRUCTURE_LINK)
                    {
                        if (structure.energy)
                            return structure.energy > 0;
                        if (structure.store)
                            return structure.store[RESOURCE_ENERGY] > 0;
                    }

                    return false;
                }
            });
        }

        //console.log("Operation " + this.opName + "[" + this.id + "]: Creep " + actor.creep.name +
        //    ": Found " + targets.length + " Resupply targets: " + targets);

        // Find where to get energy from
        var highestPriority = 0;
        var target, storeData, priority;
        for (var i = 0; i < targets.length; i++)
        {
            target = targets[i];

            if (Memory.empire.operations[this.id])
                storeData = Memory.empire.operations[this.id].home.reserves.stores[target.id];
            else
                storeData = null;

            priority = storeData && storeData.priority ? storeData.priority : 1.0

            if (priority > highestPriority)
            {
                //console.log("Operation " + this.opName + "[" + this.id + "]: Creep " + actor.creep.name +
                //    ": Highest priority " + priority + " target is now " + target);

                highestPriority = priority;
                chosenTarget = target;
            }
        }

        if (chosenTarget)
        {
            //console.log("Operation " + this.opName + "[" + this.id + "]: Creep " + actor.creep.name +
            //    ": Resupplying from " + chosenTarget + " at " + chosenTarget.pos);

            return Game.empire.factories.job.createFromType(Job.Type.Resupply, { for:actor.creep.name, target:chosenTarget });
        }
    }

	//if (actor.creep.carry.energy >= actor.creep.carryCapacity)
	//{
	//	//console.log("Operation " + this.opName + ": Actor full of energy!");
	//	return null;
	//}
	//
	//if (this.target == null)
	//{
	//	console.log("Operation " + this.opName + ": No target specified!");
	//	return null;
	//}
	//
	//if (this.target.energy == 0)
	//{
	//	if (this.doDebug)
	//		console.log("Operation " + this.opName + ": Target " + this.target + " at " + this.target.pos + " has no energy left!");
	//	
	//	return null;
	//}
	//
	//return Game.empire.factories.job.createFromType(Job.Type.Harvest, { "for": actor.creep.name, "target": this.target } );
	return null;
}

Home.prototype.createDefaultRoles = function()
{
	var roles = {};
    roles[Role.Type.Builder]    = Operation.createRolePositionObject(Role.Type.Builder,   0, 1, 3, [1.5, 1.0]);
    roles[Role.Type.Harvestes] = Operation.createRolePositionObject(Role.Type.Harvester, 0, 2, 4, [3.0, 1.2, 1.0]);
    roles[Role.Type.Repairer]   = Operation.createRolePositionObject(Role.Type.Repairer,  0, 1, 2, [1.1, 1.0]);
    roles[Role.Type.Supplier]   = Operation.createRolePositionObject(Role.Type.Supplier,  0, 1, 3, [2.5, 1.0]);
    roles[Role.Type.Upgrader]   = Operation.createRolePositionObject(Role.Type.Upgrader,  0, 0, 2, 1.0);
    return roles;
}

module.exports = Home.prototype;