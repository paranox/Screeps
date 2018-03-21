var Utils = require('utils');
var Job = require('jobTypes');
var JobBuild = require('job.build');
var JobHarvest = require('job.harvest');
var JobRepair = require('job.repair');
var JobResupply = require('job.resupply');
var JobSupply = require('job.supply');
var JobStore = require('job.store');
var JobUpgrade = require('job.upgrade');

function createJobFromData(data)
{
	if (data != undefined && data != null)
	{
		var job = createJobFromType(data.jobType, data.opts);

		if (job != null && job.readSaveData(data))
			return job;
	}

	console.log("Failed to create job of type " + Object.keys(Job.Type)[data.jobType + 1] + " from data!");
	return null;
}

function createJobFromType(jobType, opts)
{
	var job = null;

	switch (jobType)
	{
		case Job.Type.Build:
			job = Object.create(JobBuild);
			break;
		case Job.Type.Harvest:
			job = Object.create(JobHarvest);
			break;
		case Job.Type.Repair:
			job = Object.create(JobRepair);
			break;
		case Job.Type.Resupply:
			job = Object.create(JobResupply);
			break;
		case Job.Type.Supply:
			job = Object.create(JobSupply);
			break;
		case Job.Type.Store:
			job = Object.create(JobStore);
			break;
		case Job.Type.Upgrade:
			job = Object.create(JobUpgrade);
			break;
		default:
	    	console.log("Failed to create job, unhandled job type: " + Object.keys(JobType)[jobType + 1]);
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
		var job = createJobFromType(jobType, opts);

        if (job == null)
        {
            console.log("Failed to create job of type " + Object.keys(JobType)[jobType + 1] +
            	" with opts " + Utils.objectToString(opts));
        }

		return job;
	},

	createFromData: function(data)
	{
		//console.log("Creating Job from data: " + Object.keys(data));
		var job = createJobFromData(data);

        if (job == null)
            console.log("Failed to create job from data " + Utils.objectToString(data));

		return job;
	}
}