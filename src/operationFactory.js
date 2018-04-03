var Utils = require('utils');
var Operation = require('operationTypes');
var OperationHome = require('operation.home');
var OperationHarvest = require('operation.harvest');
var OperationHaul = require('operation.haul');
var OperationExpand = require('operation.expand');

function createOperationFromData(data)
{
	if (data != undefined && data != null)
	{
		var opType = Operation.Type[data.opType];
		var op = createOperationFromType(opType, data.opts);

		if (op != null && op.readSaveData(data))
			return op;
	}

	console.log("Failed to create operation of type " + data.opType + " from data!");
	return null;
}

function createOperationFromType(opType, opts)
{
	var op = null;

	switch (opType)
	{
		case Operation.Type.Home:
			op = Object.create(OperationHome);
			break;
		case Operation.Type.Harvest:
			op = Object.create(OperationHarvest);
			break;
		case Operation.Type.Haul:
			op = Object.create(OperationHaul);
			break;
		case Operation.Type.Expand:
			op = Object.create(OperationExpand);
			break;
		default:
	    	console.log("Failed to create operation, unhandled operation type: " + Operation.getNameOf(opType));
	    	return null;
	}

	op.constructor(opts);
	return op;
}

module.exports =
{
	help: function()
	{
		return ".addOperation(operation)\n" +
			".addOperationFromType(opType, opts)\n" +
			"  " + Operation.Type.Home + ":    " + Operation.getNameOf(Operation.Type.Home) +    ", opts: { " + OperationHome.getConstructorOptsHelpString() +    " }\n" +
			"  " + Operation.Type.Harvest + ": " + Operation.getNameOf(Operation.Type.Harvest) + ", opts: { " + OperationHarvest.getConstructorOptsHelpString() + " }\n" +
			"  " + Operation.Type.Haul + ":    " + Operation.getNameOf(Operation.Type.Haul) +    ", opts: { " + OperationHaul.getConstructorOptsHelpString() +    " }\n" +
			"  " + Operation.Type.Expand + ":  " + Operation.getNameOf(Operation.Type.Expand) +  ", opts: { " + OperationExpand.getConstructorOptsHelpString() +  " }";
	},

	createFromType: function(opType, opts)
	{
		//console.log("Creating Operation from type: " + Operation.getNameOf(opType));
		var op = createOperationFromType(opType, opts);

        if (op == null)
        {
            console.log("Failed to create operation of type " + Operation.getNameOf(opType) +
            	" with opts " + JSON.stringify(opts));
        }

		return op;
	},

	createFromData: function(data)
	{
		//console.log("Creating Operation from data: " + Object.keys(data));
		var op = createOperationFromData(data);

        if (op == null)
            console.log("Failed to create operation from data " + JSON.stringify(data));

		return op;
	},

	addOperation: function(operation)
	{
		if (operation.id == undefined)
		{
			operation.id = Game.empire.consumeNewOperationID();
	    	Memory.empire.nextOpID = Game.empire.nextOpID;
		}

		if (operation.home.spawn == undefined)
		{
			if (operation.home.room != undefined)
			{
				var spawns = operation.home.room.find(FIND_MY_SPAWNS);
				if (spawns.length > 0)
					operation.home.spawn = spawns[0];
			}
		}
		else
		{
			if (operation.home.room == undefined)
				operation.home.room = operation.home.spawn.room;
		}

		console.log("Adding operation: " + Utils.objectToString(operation, 0, 1));
		Memory.empire.operations[operation.id] = operation.createSaveData();
	},

	addOperationFromType: function(opType, opts)
	{
		console.log("Adding operation of type " + Operation.getNameOf(opType) + ", opts:\n" + JSON.stringify(opts));
		var op = this.createFromType(opType, opts);
		this.addOperation(op);
	}
}