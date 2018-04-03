var Utils = require('utils');
var Job = require('jobTypes');
var JobBuild = require('job.build');
var JobHarvest = require('job.harvest');
var JobRepair = require('job.repair');
var JobResupply = require('job.resupply');
var JobSupply = require('job.supply');
var JobStore = require('job.store');
var JobUpgrade = require('job.upgrade');
var JobWait = require('job.wait');
var JobPickup = require('job.pickup');
var JobClaim = require('job.claim');

function createJobFromData(data)
{
	if (data != undefined && data != null)
	{
		var jobType = Job.Type[data.jobType];
		var job = createJobFromType(jobType, data.opts);

		if (job != null && job.readSaveData(data))
			return job;
	}

	console.log("Failed to create job of type " + data.jobType + " from data!");
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
		case Job.Type.Wait:
			job = Object.create(JobWait);
			break;
		case Job.Type.Pickup:
			job = Object.create(JobPickup);
			break;
		case Job.Type.Claim:
			job = Object.create(JobClaim);
			break;
		default:
	    	console.log("Failed to create job, unhandled job type: " + Job.getNameOf(jobType));
	    	return null;
	}

	job.constructor(opts);
	return job;
}

module.exports =
{
	createFromType: function(jobType, opts)
	{
		//console.log("Creating Job from type: " + Job.getNameOf(jobType));
		var job = createJobFromType(jobType, opts);

        if (job == null)
        {
            console.log("Failed to create job of type " + Job.getNameOf(jobType) +
            	" with opts " + JSON.stringify(opts));
        }

		return job;
	},

	createFromData: function(data)
	{
		//console.log("Creating Job from data: " + Object.keys(data));
		var job = createJobFromData(data);

        if (job == null)
            console.log("Failed to create job from data " + JSON.stringify(data));

		return job;
	}
}