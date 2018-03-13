//var jobPrototype = require('jobPrototype');
var JobType = require('jobTypes');
var jobRepairTarget = require('job.repairTarget');

function createJob(data, jobIndex)
{
	var job = null;

	if (data.jobType == JobType.RepairTarget)
        job = Object.create(jobRepairTarget);
    else
    {
    	console.log("Unhandled job type: " + data.jobType);
    	return null;
    }

    job.constructor(data.jobType, null);
    job.setIndex(jobIndex);

    if (job != null && job.readSaveData(data))
		return job;

	return null;
}

module.exports =
{
	createJobFromData: function(data, jobIndex)
	{
		return createJob(data, jobIndex);
	},

	loadFromMemory: function(creep, jobIndex)
	{
		if (creep.memory.jobs == undefined)
		{
			console.log(creep.name + ": Unable to load job from memory, jobs array was not defined");
			return false;
		}

		if (jobIndex < 0 || jobIndex >= creep.memory.jobs.length)
		{
			console.log(creep.name + ": Unable to load job from memory, invalid jobIndex: " + this.jobIndex);
			return false;
		}

		return createJob(creep.memory.jobs[jobIndex], jobIndex);
	},

	saveToMemory: function(creep, jobs)
	{
		var data = [];

		var job;
	    for (var i = 0; i < jobs.length; i++)
	    {
	    	job = jobs[i];

	    	if (job != null)
	    		data.push(job.createSaveData());
	    }

        creep.memory.jobs = data;
	}
}