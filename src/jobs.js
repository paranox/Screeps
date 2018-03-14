var JobType = require('jobTypes');
var JobRepairTarget = require('job.repairTarget');

function createJob(data, jobIndex)
{
	var job = null;

	if (data.jobType == JobType.RepairTarget)
    {
    	//console.log("Creating Job\<RepairTarget\>");
    	job = Object.create(JobRepairTarget);
    }
    else
    {
    	console.log("Unhandled job type: " + data.jobType);
    	return null;
    }

    job.constructor(data.opts);
    job.setIndex(jobIndex);

    if (job.readSaveData(data))
		return job;

	console.log("Failed to read job of type " + data.jobType + " from data!");
	return null;
}

module.exports =
{
	createJobFromData: function(data, jobIndex)
	{
		//console.log("Creating Job[" + jobIndex + "] from data");
		return createJob(data, jobIndex);
	},

	loadFromMemory: function(actor, jobIndex)
	{
		if (actor.creep.memory.jobs == undefined)
		{
			console.log(actor.creep.name + ": Unable to load job from memory, jobs array was not defined");
			return false;
		}

		if (jobIndex < 0 || jobIndex >= actor.creep.memory.jobs.length)
		{
			console.log(actor.creep.name + ": Unable to load job from memory, invalid jobIndex: " + this.jobIndex);
			return false;
		}

		return createJob(actor.creep.memory.jobs[jobIndex], jobIndex);
	},

	saveToMemory: function(actor, jobs)
	{
		var data = [];

		var job;
	    for (var i = 0; i < jobs.length; i++)
	    {
	    	job = jobs[i];

	    	if (job != null)
	    		data.push(job.createSaveData());
	    }

        actor.creep.memory.jobs = data;
	}
}