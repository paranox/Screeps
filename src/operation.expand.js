var Utils = require('utils');
var Operation = require('operationTypes');
var OperationBase = require('operationBase');
var Role = require('roleTypes');
var Job = require('jobTypes');

function Expand(opts)
{
	//console.log("OperationBase->Expand.constructor(opts: " + JSON.stringify(opts) + ")");
	this.opType = Operation.Type.Expand;
	this.opName = Operation.getNameOf(this.opType);
	
    this.base = OperationBase;
    this.base.constructor(this, opts);

	var roomCount = 0;
	for (const id in Game.rooms)
	{
		if (Game.rooms[id].controller.my)
		{
			//console.log("I'm controlling room " + id);
			roomCount++;
		}
	}

	if (Game.gcl.level <= roomCount)
	{
		//console.log("Expand operation is not possible due to GCL " + Game.gcl.level +
		//	" is less than or equal to the number of controlled rooms " + roomCount +
		//	"!\nProgress: " + Game.gcl.progress + " / " + Game.gcl.progressTotal);

		this.isHalted = true;
	}
	//else
	//	console.log("I can expand! GCL " + Game.gcl.level + " > " + roomCount);

	if (!opts)
		return;
	
	if (opts.target)
	{
		if (opts.target instanceof Room)
		{
			console.log("Expand Operation target room: " + opts.target);
			this.target = opts.target;
			this.targetName = opts.target.name;
		}
		else
			console.log("Invalid target Expand Operation target provided: " + opts.target);
	}
	else if (opts.targetName)
	{
		console.log("Expand Operation target room name: " + opts.targetName);

		this.targetName = opts.targetName;
		this.target = Game.rooms.hasOwnProperty(opts.targetName) ? Game.rooms[opts.targetName] : null;
	}
}

/// Memory functions, should always be called via context's override
/// NOTE: These require a context reference and are usually

Expand.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (!data)
		return false;
	
	if (data.target != undefined)
	{
		this.targetName = data.target;
		this.target = Game.rooms.hasOwnProperty(data.target) ? Game.rooms[data.target] : null;
	}

	return true;
}

Expand.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);
	
	if (this.target)
		data.target = this.target.name;
	else if (this.targetName)
		data.target = this.targetName;

	return data;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

Expand.prototype.getConstructorOptsHelpString = function()
{
    return OperationBase.getConstructorOptsHelpString() + ", target, targetName";
}

Expand.prototype.onUpdate = function()
{

}

Expand.prototype.getJob = function(actor)
{
	var opts = { for:actor.creep.name, targetName:this.targetName };
	if (this.target) opts.target = this.target;

	console.log("Operation " + this.opName + "[" + this.id + "]: Giving " + actor.creep.name +
		" Claim job with opts: " + Utils.objectToString(opts, 0, 1));

	return Game.empire.factories.job.createFromType(Job.Type.Claim, opts);
}

Expand.prototype.createDefaultRoles = function()
{
	var roles = {};
	roles[Role.Type.Claimer] = Operation.createRolePositionObject(Role.Type.Claimer, 0, 0, 1, 1.0);
	return roles;
}

module.exports = Expand.prototype;