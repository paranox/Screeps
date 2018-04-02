var Utils = require('utils');
var Role = require('roleTypes');

function Actor(creep)
{
	this.doDebug = creep.memory.doDebug == true;

	if (this.doDebug)
		console.log("Actor.constructor(" + creep.name + ")");

	this.creep = creep;

    if (creep.spawning)
    {
    	creep.memory.isSpawning = true;
        return;
    }
    else if (creep.memory.isSpawning)
    {
    	delete creep.memory.isSpawning;
        creep.memory.home = creep.room.name;
    	creep.say("HelloWorld");
    }

    if (creep.memory.home == undefined)
    {
        if (this.doDebug)
            console.log("Actor " + creep.name + ": Home room set to " + creep.room);
        
        creep.memory.home = creep.room.name;
    }

    this.home = Game.rooms[creep.memory.home];

    this.state = 0;
    if (creep.memory.state != undefined)
    {
        if (this.doDebug)
            console.log("Actor " + creep.name + ": State[" + creep.memory.state + "] read from creep memory");

        this.state = creep.memory.state;
    }

    this.roleType = -1;
    this.roleName = "Unknown";
    if (creep.memory.role != undefined)
    {
        if (Role.isDefined(creep.memory.role))
        {
            this.roleType = creep.memory.role;
            this.roleName = Role.getNameOf(this.roleType);   
        }
        else
            console.log("Actor " + creep.name + ": Unhandled role parameter: " + creep.memory.role);
    }
    else
        console.log("Actor " + creep.name + ": No role parameter!");

    this.jobs = [];

    if (creep.memory.jobs != undefined && creep.memory.jobs.length > 0)
    {
	    if (this.doDebug)
	        console.log("Actor " + creep.name + ": Found " + creep.memory.jobs.length + " jobs in creep memory");

	    var job;
	    for (let i = 0; i < creep.memory.jobs.length; i++)
	    {
	        job = Game.empire.factories.job.createFromData(creep.memory.jobs[i]);

	        if (job != null)
	        {
	        	job.setIndex(i);

	            if (this.doDebug)
	            {
	            	console.log("Actor " + creep.name +
	            		": Job[" + i + "]<" + job.jobName + ":" + job.jobType + ">: Successfully loaded from memory");
	    		}

            	this.jobs.push(job);
	        }
	        else// if (this.doDebug)
	            console.log("Actor " + creep.name + ": Failed to load Job[" + i + "] from memory");
	    }

	    this.currentJob = this.jobs.length > 0 ? this.jobs.length - 1 : -1;
	}
	else if (this.doDebug)
        console.log("Actor " + creep.name + ": No jobs in creep memory");
}

Actor.prototype.setOperation = function(operation)
{
	if (operation == null) // Catches both undefined and null
	{
        if (this.doDebug)
            console.log("Actor " + this.creep.name + ": operation cleared");
    }
    else if (this.doDebug)
		console.log("Actor " + this.creep.name + ": operation set to " + operation.opName);

	this.operation = operation;
    
    if (this.creep.memory.operationID == undefined)
        this.creep.memory.operationID = operation.id;
}

Actor.prototype.addJob = function(job)
{
	if (this.doDebug)
		console.log("Actor " + this.creep.name + ": Adding job " + job.jobName + ":" + job.jobType);

	this.jobs.push(job);
}

Actor.prototype.init = function(role)
{
	if (role == null)
	{
		console.log("Actor " + this.creep.name + ": No role assigned on .init()!");
		return;
	}
	else if (this.doDebug)
		console.log("Actor " + this.creep.name + ": Role: " + JSON.stringify(role));

	this.role = role;
	this.role.init(this);
}

Actor.prototype.run = function()
{

    /*if (creep.memory.operationID != undefined)
    {
        if (this.doDebug)
            console.log("Actor " + creep.name + ": Operation ID[" + creep.memory.operationID + "] read from creep memory");

        var op = Game.empire.operations[creep.memory.operationID];
        if (op != null)
        {
            console.log("Actor " + creep.name + ": Assigned to operation " + op.id + " " + op.opName + " of type " + op.opType);
            op.addActor(this);
        }
        else
            console.log("Actor " + creep.name + ": Could not find operation by the id of " + creep.memory.operationID);
    }*/

    
	if (this.role != null)
    	this.role.run(this);
    else
		console.log("Actor " + this.creep.name + ": No role assigned on .run()!");
}

Actor.prototype.end = function()
{
	if (this.doDebug)
		console.log("Actor " + this.creep.name + ": end()");

    if (this.role != null)
    	this.role.end(this);
    else
		console.log("Actor " + this.creep.name + ": No role assigned on .end()!");

    //if (this.operation != null)
    //    this.creep.memory.operationID = this.operation.id;

    var jobsToSave = [];

	if (this.jobs != undefined && this.jobs != null && this.jobs.length > 0)
    {
        var job;
        for (var i = 0; i < this.jobs.length; i++)
        {
            job = this.jobs[i];

            if (job == undefined || job == null)
            	continue;

            if (job.hasFinished == true)
            {
            	if (this.doDebug)
            		console.log("Actor(" + this.creep.name + ": Job[" + i + "]: " + job.jobName + ":" + job.jobType + " is finished!");
            }
            else
            {
    			if (this.doDebug)
    			{
            		console.log("Actor(" + this.creep.name + ": Job[" + i + "]: " + job.jobName + ":" + job.jobType + " is unfinished!");
            		console.log("Creating save data from job: " + Utils.objectToString(job, 0, 2));
    			}

            	jobsToSave.push(job.createSaveData());
            }
        }
    }
    else if (this.doDebug)
    {
        console.log("Actor(" + this.creep.name + "): No jobs found to clear or save!");
        return;
    }

    if (this.doDebug)
    {
        console.log("Actor(" + this.creep.name + "): Saving " + jobsToSave.length + " jobs to memory");
        for (var i = 0; i < jobsToSave.length; i++)
        	console.log("Job[" + i + "]: " + JSON.stringify(jobsToSave[i]));
    }

    this.creep.memory.jobs = jobsToSave;
}

module.exports = Actor.prototype;