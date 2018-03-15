var JobType = require('jobTypes');
var JobRepairTarget = require('job.repairTarget');
var JobHarvest = require('job.harvest');

function createJobFromData(data)
{
	if (data != undefined && data != null)
	{
		var job = createJobFromType(data.jobType, data.opts);

		if (job != null && job.readSaveData(data))
			return job;
	}

	console.log("Failed to read job of type " + Object.keys(JobType)[data.jobType + 1] + " from data!");
	return null;
}

function createJobFromType(jobType, opts)
{
	var job = null;

	switch (jobType)
	{
		case JobType.RepairTarget:
			job = Object.create(JobRepairTarget);
			break;
		case JobType.Harvest:
			job = Object.create(JobHarvest);
			break;
		default:
	    	console.log("Failed to read job, unhandled job type: " + Object.keys(JobType)[jobType + 1]);
	    	return null;
	}

	job.constructor(opts);
	return job;
}

module.exports =
{
	createFromType: function(jobType, opts)
	{
		//console.log("Creating Job from type: " + Object.keys(JobType)[jobType + 1]);
		return createJobFromType(jobType, opts);
	},

	createFromData: function(data)
	{
		//console.log("Creating Job from data: " + Object.keys(data));
		return createJobFromData(data);
	}
}