var Jobs = require('jobs');

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
	        job = Jobs.createJobFromData(creep.memory.jobs[i], i);

	        if (job != null)
	        {
	            if (this.doDebug)
	            {
	            	console.log("Actor " + creep.name +
	            		": Job[" + i + "]<" + job.jobName + ":" + job.jobType + ">: Successfully loaded from memory");
	    		}

	            this.jobs.push(job);
	        }
	        else if (this.doDebug)
	            console.log("Actor " + creep.name + ": Failed to load Job[" + i + "] from memory");
	    }

	    this.currentJob = this.jobs.length > 0 ? this.jobs[this.jobs.length - 1] : null;
	}
	else if (this.doDebug)
        console.log("Actor " + creep.name + ": No jobs in creep memory");
};

Actor.prototype.end = function()
{
    var jobsToSave = [];

    if (this.jobs != undefined)
    {
        var job;
        for (var i = 0; i < this.jobs.length; i++)
        {
            job = this.jobs[i];

            if (job.hasEnded == false)
                jobsToSave.push(job);
        }
    }
    else if (this.doDebug)
    {
        console.log(this.creep.name + ": No jobs found to clear or save!");
        return;
    }

    if (this.doDebug == true)
        console.log(this.creep.name + ": Saving " + jobsToSave.length + " jobs to memory");

    Jobs.saveToMemory(this, jobsToSave);
};

module.exports = Actor.prototype;