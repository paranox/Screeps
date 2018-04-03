var Utils = require('utils');
var OperationFactory = require('operationFactory');
var Operation = require('operationTypes');
var RoleFactory = require('roleFactory');
var Role = require('roleTypes');
var JobFactory = require('jobFactory');
var CreepFactory = require('creepFactory');
var Actor = require('actor');

module.exports =
{
	init: function()
	{
		Game.empire =
	    {
	        actors: {},
	        actorCount: 0,
	        bodies: { countTotal: 0, countPerType: {} },
	        roles: { countPerType: {},
	        	getCount: function(type) { return this.countPerType.hasOwnProperty(type) ? this.countPerType[type] : 0; }
	        },

			nextOpID: 0,
	        operations: {},
	        getNextOperationID: function() { return "Op" + this.nextOpID; },
	        consumeNewOperationID: function() { var id = this.getNextOperationID(); this.nextOpID++; return id; }
	    }

		Game.empire.factories = { creep:CreepFactory, operation:OperationFactory, role:RoleFactory, job:JobFactory };
	},

	readData: function()
	{
		/// Initialize global empire object data ///

	    for (const id in BODYPART_COST)
	    	Game.empire.bodies.countPerType[id] = 0;

	    /// Initialize Memory ///

	    if (Memory.empire == undefined)
	    	Memory.empire = {};

	    // Used for an overview collection of actors (creeps) within the empire
	    if (Memory.empire.actors == undefined)
	    {
	    	Memory.empire.actors =
		    {
		    	count: 0,
	    		bodyPartsTotal: 0,
	    		bodyParts: {}
		    };

		    for (const id in BODYPART_COST)
		    	Memory.empire.actors.bodyParts[id] = 0;
		}

		// Used for an overview collection of creep roles within the empire
	    if (Memory.empire.roles == undefined)
	    	Memory.empire.roles = {};

	    /// Process Memory ///

	    /// Actors ///

	    var actor, creep;
	    for (var name in Game.creeps)
	    {
	        creep = Game.creeps[name];

	        /// START Temporary Creep memory adjustments go here
    		var oldRoleType = creep.memory.role;
        	if (typeof oldRoleType == "number")
        	{
        		var newRoleType = Role.getNameOf(oldRoleType);
            	creep.memory.role = newRoleType;
				console.log("Updated creep " + creep.name + " role type from " + oldRoleType + " to: " + newRoleType);
        	}

            if (Array.isArray(creep.memory.jobs))
            {
            	var Job = null;
            	var oldJobType, newJobType;
            	for (var i = 0; i < creep.memory.jobs.length; i++)
            	{
            		oldJobType = creep.memory.jobs[i].jobType;
            		if (typeof oldJobType == "number")
            		{
            			if (Job == null) Job = require('jobTypes');
		        		newJobType = Job.getNameOf(oldJobType);
		            	creep.memory.jobs[i].jobType = newJobType;
						console.log("Updated creep " + creep.name + " job " + i + " type from " +
							oldJobType + " to: " + newJobType);
            		}
            	}
            }
	        /// END Creep Temporary memory adjustments

	        Memory.creeps[name].id = creep.id;

	        actor = Object.create(Actor);
	        actor.constructor(creep);
	        Game.empire.actors[creep.id] = actor;

	        Game.empire.actorCount++;
	        Game.empire.bodies.countTotal += creep.body.length;

	        for (var i = 0; i < creep.body.length; i++)
	        {
	        	//console.log("Creep " + name + " body[" + i + "]: " + JSON.stringify(creep.body[i]));
	        	Game.empire.bodies.countPerType[creep.body[i].type]++;
	        }

	        if (actor.roleType >= 0)
	        {
	        	if (Game.empire.roles.countPerType.hasOwnProperty(actor.roleType))
	        		Game.empire.roles.countPerType[actor.roleType]++;
	        	else
	        		Game.empire.roles.countPerType[actor.roleType] = 1;

	        	//console.log("Added role " + actor.roleType + " to list, now at " + Game.empire.roles.countPerType[actor.roleType]);

	        	actor.init(RoleFactory.getPrototype(actor.roleType));

	        	//if (actor.)
	        }
	    }

	    //console.log("Created " + Object.keys(Game.empire.actors).length + " Actor objects:\n" +
	    //	Utils.objectToString(Game.empire.actors, 0, 0));

	    /// Operations ///

		if (Memory.empire.nextOpID == undefined)
	    	Memory.empire.nextOpID = Game.empire.nextOpID;
	    else
	    	Game.empire.nextOpID = Memory.empire.nextOpID;

	    if (Memory.empire.operations == undefined)
	    {
	        Memory.empire.operations = {};

	        var spawn = null;
	        for (const name in Game.spawns)
	        {
	            if (Game.spawns.hasOwnProperty(name))
	                spawn = Game.spawns[name];

	            if (spawn != null)
	            {
	                console.log("Found initial spawn structure!");
	                break;
	            }
	        }

	        var opts =
	        {
	            id: Game.empire.consumeNewOperationID(),
	            home: { room:spawn.room, spawn:spawn },
	            target: spawn.pos.findClosestByPath(FIND_SOURCES)
	        };

	        op = OperationFactory.createFromType(Operation.Type.Home, opts);
	        Game.empire.operations[op.id] = op;

	        console.log("Initialized initial home operation on " + opts.target + "!");
	    }
	    else
	    {
	        for (const id in Memory.empire.operations)
	        {
		        /// START Temporary Operation memory adjustments go here
	        	if (typeof Memory.empire.operations[id].opType == "number")
	            	Memory.empire.operations[id].opType = Operation.Type[Memory.empire.operations[id].opType];
	            if (Memory.empire.operations[id].opType == Operation.getNameOf(Operation.Type.Home))
	            {
	            	var spawn = Game.getObjectById(Memory.empire.operations[id].home.spawnID)
	            	if (spawn != null && spawn.memory.spawnQueue)
	            	{
	            		for (const order in spawn.memory.spawnQueue)
	            		{
	            			if (spawn.memory.spawnQueue[order].blueprint && spawn.memory.spawnQueue[order].blueprint.opts &&
	            				spawn.memory.spawnQueue[order].blueprint.opts.memory &&
	            				spawn.memory.spawnQueue[order].blueprint.opts.memory.role)
	            			{
	            				var oldRoleType = spawn.memory.spawnQueue[order].blueprint.opts.memory.role;
	            				if (typeof oldRoleType == "number")
	            				{
		            				var newRoleType =
		            					Role.getNameOf(spawn.memory.spawnQueue[order].blueprint.opts.memory.role);

	            					spawn.memory.spawnQueue[order].blueprint.opts.memory.role = newRoleType;

		            				console.log("Updated spawn order " + order + " creep role type from " +
		            					oldRoleType + " to: " + newRoleType);
	            				}
	            			}
	            		}
	            	}
	            }
		        /// END Operation Temporary memory adjustments

	            op = OperationFactory.createFromData(Memory.empire.operations[id]);
	            Game.empire.operations[op.id] = op;
	        }
	    }
	},

	onTickStart: function()
	{
		//console.log("Empire.onTickStart()");

		var actor, op;
	    for (var id in Game.empire.actors)
	    {
	        actor = Game.empire.actors[id];
	        
	        if (actor.creep.memory.operationID != undefined)
	        {
	            op = Game.empire.operations[actor.creep.memory.operationID];
	            actor.setOperation(op);
	            op.addActor(actor);
	        }
	    }
	},

	onTickEnd: function()
	{
		//console.log("Empire.onTickEnd()");
		
    	//console.log(Object.keys(Game.empire.actors).length + " actors found at end of tick:\n" +
    	//	Utils.objectToString(Game.empire.actors, 0, 0));

	    Memory.empire.actors.count = Object.keys(Game.empire.actors).length;
	    Memory.empire.actors.bodyPartsTotal = Game.empire.bodies.countTotal;
	    for (const part in Game.empire.bodies.countPerType)
	    	Memory.empire.actors.bodyParts[part] = Game.empire.bodies.countPerType[part];

	    for (const type in Memory.empire.roles)
	    	Memory.empire.roles[type] = 0;
	    for (const role in Game.empire.roles.countPerType)
	    	Memory.empire.roles[Role.getNameOf(role)] = Game.empire.roles.countPerType[role];

	    Memory.empire.nextOpID = Game.empire.nextOpID;
	    for (const id in Game.empire.operations)
	    	/*Memory.empire.operations[id] = */Game.empire.operations[id].createSaveData();
	}
}