var Utils = require('utils');
var OperationFactory = require('operationFactory');
var Operation = require('operationTypes');
var RoleFactory = require('roleFactory');
var Role = require('roleTypes');
var Actor = require('actor');

module.exports =
{
	init: function()
	{
		/// Initialize global empire object ///

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

	        if (creep.spawning)
	            continue;

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

	        op = OperationFactory.createFromType(Operation.Type.Harvest, opts);
	        Game.empire.operations[op.id] = op;

	        console.log("Initialized initial harvest operation on " + opts.target + "!");
	    }
	    else
	    {
	        for (const id in Memory.empire.operations)
	        {
	            op = OperationFactory.createFromData(Memory.empire.operations[id]);
	            Game.empire.operations[op.id] = op;
	        }
	    }
	},

	onTickStart: function()
	{
		//console.log("Empire.onTickStart()");
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

	    for (const role in Game.empire.roles.countPerType)
	    	Memory.empire.roles[Role.getNameOf(role)] = Game.empire.roles.countPerType[role];

	    Memory.empire.nextOpID = Game.empire.nextOpID;
	    for (const id in Game.empire.operations)
	    	Memory.empire.operations[id] = Game.empire.operations[id].createSaveData();
	}
}