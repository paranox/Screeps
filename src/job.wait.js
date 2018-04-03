var Utils = require('utils');
var JobBase = require('jobBase');
var Job = require('jobTypes');

function Wait(opts)
{
	//console.log("JobBase->Wait.constructor(opts: " + Utils.objectToString(opts, 0, 1) + ")");
	this.jobName = "Wait";
	this.jobType = Job.Type.Wait;
	
    this.base = JobBase;
    this.base.constructor(this, opts);

	if (!opts)
		return;
	
	if (opts.target != null)
		this.target = opts.target;
	if (opts.waitType != undefined)
		this.waitType = opts.waitType;
	if (opts.testType != undefined)
		this.testType = opts.testType;
	if (opts.testValue != undefined)
		this.testValue = opts.testValue;
}

Wait.prototype = Object.create(JobBase);
Wait.prototype.constructor = Wait;

Wait.prototype.WaitType = Object.freeze({ Idle:0, EnergyLevel:1 });
Wait.prototype.TestType = Object.freeze({ Equal:0, Less:1, Greater:2 });

Wait.prototype.readSaveData = function(data)
{
	if (!this.base.readSaveData(this, data))
		return false;

	if (data.target != null)
	{
		let target = Game.getObjectById(data.target);

		if (target == null)
		{
			console.log("Target id[" + data.target + "] was not found!");
			return false;
		}

		this.target = target;
	}

	if (data.waitType != undefined)
		this.waitType = data.waitType;
	if (data.testType != undefined)
		this.testType = data.testType;
	if (data.testValue != undefined)
		this.testValue = data.testValue;

	//console.log("Target found based on save data: " + data.target);
	return true;
}

Wait.prototype.createSaveData = function()
{
	var data = this.base.createSaveData(this);

	if (this.target != null) data["target"] = this.target.id;
	if (this.waitType != undefined) data["waitType"] = this.waitType;
	if (this.testType != undefined) data["testType"] = this.testType;
	if (this.testValue != undefined) data["testValue"] = this.testValue;

	return data;
}

Wait.prototype.onStart = function(actor)
{
	actor.creep.say("Wait!");
}

Wait.prototype.onUpdate = function(actor)
{
	if (actor.doDebug)
        console.log(actor.creep.name + ": Running Job<" + this.jobType + ">(" + this.jobName + ")");

    switch (this.waitType)
    {
    	case this.WaitType.Idle:
    		break;
    	case this.WaitType.EnergyLevel:
	    	if (this.target != null && this.doTest(this.target.energy))
	    	{
	    		this.finish(actor, true);
	    		return;
	    	}
	    	break;
    	default:
    		console.log(actor.creep.name + ": Unhandled Wait Job WaitType " + this.waitType);
    		break;
    }
}

Wait.prototype.doTest = function(value)
{
	if (value == undefined)
	{
		console.log(actor.creep.name + ": No Wait Job value provided for test type " + this.testType + "!");
		return false;
	}
	if (this.testValue == undefined)
	{
		console.log(actor.creep.name + ": No Wait Job test value defined for test type " + this.testType + "!");
		return false;
	}

	switch (this.testType)
	{
		case this.TestType.Equal:
			return value == this.testValue;
		case this.TestType.Less:
			return value < this.testValue;
		case this.TestType.Greater:
			return value > this.testValue;
    	default:
    		console.log(actor.creep.name + ": Unhandled Wait Job TestType " + this.testType);
    		break;
	}
}

module.exports = Wait.prototype;