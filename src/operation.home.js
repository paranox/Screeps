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

Home.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);
	
	data.home.roomLevel = this.home.roomLevel;
    if (this.home.reserves)
    {
        data.home.reserves = {};
        data.home.reserves.resources = this.home.reserves.resources;
        data.home.reserves.stores = {};
        for (var i = 0; i < this.home.reserves.stores.length; i++)
            data.home.reserves.stores[this.home.reserves.stores[i].id] = { type:this.home.reserves.stores[i].structureType };
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
            { return structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE } });

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
            let percentage = Math.floor(100.0 * (1 - spawn.spawning.remainingTime / spawn.spawning.needTime));
            let text = "Spawning " + percentage + "%";
            this.roomVisual.text(text, spawn.pos.x, spawn.pos.y + 1.3, { font:0.5, stroke:"#000000" });
            this.roomVisual.text(spawn.spawning.name, spawn.pos.x, spawn.pos.y + 2, { font:0.5, stroke:"#000000" });
            this.roomVisual.text("Orders: " + Object.keys(spawn.memory.spawnQueue).length,
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
        var minCost = spawnQueueEntry.minCost != undefined ? spawnQueueEntry.minCost : 300;
        var maxCost = spawnQueueEntry.maxCost != undefined ? spawnQueueEntry.maxCost : energyAvailable;

        if (this.roomVisual)
        {
            this.roomVisual.text("Spawn Order: " + spawnQueueEntry.id, spawn.pos.x, spawn.pos.y + 1.3, { font:0.5, stroke:"#000000" });
            this.roomVisual.text("Priority: " + spawnQueueEntry.priority, spawn.pos.x, spawn.pos.y + 2, { font:0.5, stroke:"#000000" });
        }

        //var chosenQueueID = null;
        //var chosenBlueprint = null;

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

            spawnQueueEntry = null;
        }
        else if (minCost > energyAvailable)
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

            spawnQueueEntry = null;
        }
        else
        {
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
        }

        this.roomVisual.text("Orders: " + Object.keys(spawn.memory.spawnQueue).length,
            spawn.pos.x, spawn.pos.y + 3.4, { font:0.5, stroke:"#000000" });

        if (spawnQueueEntry != null)
        {
            //console.log("Operation " + this.opName + "[" + this.id + "]: Trying to build spawn order " + spawnQueueEntry.id +
            //    "\n" + JSON.stringify(spawnQueueEntry));

            if (Game.empire.factories.creep.tryBuildCreepFromBlueprint(spawn, spawnQueueEntry.blueprint, minCost, maxCost))
            {
                spawn.memory.spawning = spawnQueueEntry;

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
        console.log("Operation " + this.opName + "[" + this.id + "]: Creep " + actor.creep.name +
            " not in the correct room " + actor.creep.room + ", ordering it to return home to " + this.home.room + "!");

        return Game.empire.factories.job.createFromType(Job.Type.MoveTo, { target:this.home.room });
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
    roles[Role.Type.Harvesters] = Operation.createRolePositionObject(Role.Type.Harvester, 0, 2, 4, [3.0, 1.2, 1.0]);
    roles[Role.Type.Repairer]   = Operation.createRolePositionObject(Role.Type.Repairer,  0, 1, 2, [1.1, 1.0]);
    roles[Role.Type.Supplier]   = Operation.createRolePositionObject(Role.Type.Supplier,  0, 1, 3, [2.5, 1.0]);
    roles[Role.Type.Upgrader]   = Operation.createRolePositionObject(Role.Type.Upgrader,  0, 0, 2, 1.0);
    return roles;
}

module.exports = Home.prototype;