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

	if (data.reservationTicks)
		this.reservationTicks = data.reservationTicks;
	if (data.lastObserved)
		this.lastObserved = data.lastObserved;

	return true;
}

Expand.prototype.writeSaveData = function()
{
	var data = this.base.writeSaveData(this);
	
	if (this.target)
		data.target = this.target.name;
	else if (this.targetName)
		data.target = this.targetName;

	if (this.reservationTicks)
		data.reservationTicks = this.reservationTicks;
	if (this.lastObserved)
		data.lastObserved = this.lastObserved;

	return data;
}

/// Operation functions, can be overridden
/// NOTE: These must be set to the context in the constructor

Expand.prototype.getConstructorOptsHelpString = function()
{
    return OperationBase.getConstructorOptsHelpString() + ", target:Room, targetName:string_roomName";
}

Expand.prototype.onStart = function()
{
	this.roomCount = 0;

	var me = null;
	var room;
	for (const id in Game.rooms)
	{
		room = Game.rooms[id];
		if (room.controller.my)
		{
			//console.log("I'm controlling room " + id);

			if (me == null)
				me = room.controller.owner.username;

			this.roomCount++;
		}
	}

	if (this.target)
	{
		if (this.target.controller.my)
		{
			if (!this.isHalted)
				console.log("Operation " + this.opName + "[" + this.id + "]: Room " + this.target + " already claimed successfully!");

			this.isHalted = true;
		}
		else if (me != null && this.target.controller.reservation && this.target.controller.reservation.username != me)
		{
			this.reservationTicks = room.controller.reservation.ticksToEnd;
			this.lastObserved = Game.time;

			if (!this.isHalted && this.reservationTicks > 5000)
			{
				this.isHalted = true;

				console.log("Operation " + this.opName + "[" + this.id + "]: Room " + this.target +
					" fully reserved, halting operation!");
			}
			else if (this.isHalted && this.reservationTicks < 4000)
			{
				this.isHalted = false;

				console.log("Operation " + this.opName + "[" + this.id + "]: Room " + this.target +
					" reservation dropped to " + this.reservationTicks + " , resuming operation!");
			}
		}
	}
	else
	{
		this.estimatedReservationTicks = this.reservationTicks - (Game.time - this.lastObserved);

		//console.log("No visibility to " + this.targetName + ", estimated reservation ticks: " +
		//	this.estimatedReservationTicks + "!");

		if (this.isHalted && this.estimatedReservationTicks < 4000)
		{
			this.isHalted = false;

				console.log("Operation " + this.opName + "[" + this.id + "]: Room " + this.target +
					" estimated reservation dropped to " + this.estimatedReservationTicks + " , resuming operation!");
		}
	}

	this.canClaim = Game.gcl.level > this.roomCount;
}

Expand.prototype.getJob = function(actor)
{
	var opts = { for:actor.creep.name };

	if (this.target && this.target == actor.creep.room)
	{
		if (this.target.controller.my)
			return null;

		opts.target = this.target;

		if (this.canClaim)
		{
			console.log("Operation " + this.opName + "[" + this.id + "]: Giving " + actor.creep.name +
				" Claim job with opts: " + Utils.objectToString(opts, 0, 1));
		}
		else
		{
			console.log("Operation " + this.opName + "[" + this.id + "]: Claiming is NOT possible! GCL " + Game.gcl.level +
				" needs to be greater than the number of controlled rooms: " + this.roomCount +
				"!\nProgress to GCL level " + (Game.gcl.level + 1) + ": " + Game.gcl.progress + " / " + Game.gcl.progressTotal);

			opts.doReserve = true;
		}

		return Game.empire.factories.job.createFromType(Job.Type.Claim, opts);
	}

	if (this.targetName)
	{
		opts.targetName = this.targetName;

		console.log("Operation " + this.opName + "[" + this.id + "]: Giving " + actor.creep.name +
			" MoveTo job with opts: " + Utils.objectToString(opts, 0, 1));

		return Game.empire.factories.job.createFromType(Job.Type.MoveTo, opts);
	}

	console.log("Operation " + this.opName + "[" + this.id + "]: Unable to give job to " + actor.creep.name);
	return null;
}

Expand.prototype.createDefaultRoles = function()
{
	var roles = {};
	roles[Role.Type.Claimer] = Operation.createRolePositionObject(Role.Type.Claimer, 0, 0, 1, 1.0);
	return roles;
}

module.exports = Expand.prototype;