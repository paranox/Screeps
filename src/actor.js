var Utils = require('utils');
var JobFactory = require('jobFactory');

function Actor(creep)
{
	this.doDebug = creep.memory.doDebug == true;

	if (this.doDebug)
		console.log("Actor.constructor(" + creep.name + ")");

	this.creep = creep;
    this.state = 0;

    if (creep.memory.state != undefined)
    {
    	this.state = creep.memory.state;

        if (this.doDebug)
            console.log("Actor " + creep.name + ": State[" + this.state + "] read from creep memory");
    }

    this.jobs = [];

    if (creep.memory.jobs != undefined && creep.memory.jobs.length > 0)
    {
	    if (this.doDebug)
	        console.log("Actor " + creep.name + ": Found " + creep.memory.jobs.length + " jobs in creep memory");

	    var job;
	    for (let i = 0; i < creep.memory.jobs.length; i++)
	    {
	        job = JobFactory.createFromData(creep.memory.jobs[i]);

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
};

Actor.prototype.setState = function(state)
{
	if (state == undefined)
		state = 0;

	if (this.state != state && this.doDebug)
		console.log("Actor " + this.creep.name + ": state set to " + state);

	this.state = state;
};

Actor.prototype.addJob = function(job)
{
	if (this.doDebug)
		console.log("Actor " + this.creep.name + ": Adding job " + job.jobName + ":" + job.jobType);

	this.jobs.push(job);
};

Actor.prototype.end = function()
{
    var jobsToSave = [];

	if (this.doDebug)
		console.log("Actor " + this.creep.name + ": end()");

    if (this.jobs != undefined && this.jobs != null && this.jobs.length > 0)
    {
        var job;
        for (var i = 0; i < this.jobs.length; i++)
        {
            job = this.jobs[i];

            if (job == undefined || job == null)
            	continue;

            if (job.hasEnded == true)
            {
            	if (this.doDebug)
            		console.log("Actor(" + this.creep.name + ": Job[" + i + "]: " + job.jobName + ":" + job.jobType + " is finished!");
            }
            else
            {
    			if (this.doDebug)
    			{
            		console.log("Actor(" + this.creep.name + ": Job[" + i + "]: " + job.jobName + ":" + job.jobType + " is unfinished!");
            		console.log("Creating save data from job: " + Utils.objectToString(job));
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
        	console.log("Job[" + i + "]: " + Utils.objectToString(jobsToSave[i]));
    }

    this.creep.memory.jobs = jobsToSave;
};

module.exports = Actor.prototype;