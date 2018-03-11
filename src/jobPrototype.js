function Job(jobName)
{
	//console.log("Job(" + jobName + ")");
	this.jobName = jobName;
};

Job.prototype.loadMemory = function(creep, jobIndex)
{
	console.log(creep.name + ": " + this.jobName + " of type " + (typeof this) + " has nothing to load from memory!");
}

Job.prototype.saveMemory = function(creep, jobIndex)
{
	console.log(creep.name + ": " + this.jobName + " of type " + (typeof this) + " has nothing to save to memory!");
}

Job.prototype.clearMemory = function(creep, jobIndex)
{
	console.log(creep.name + ": " + this.jobName + " of type " + (typeof this) + " has nothing to clear from memory!");
}

Job.prototype.init = function(creep, memoryEntry)
{
	
}

Job.prototype.start = function(creep)
{
	
}

Job.prototype.run = function(creep)
{
	console.log(creep.name + ": " + this.jobName + " of type " + (typeof this) + " doesn't require any work!");
}

Job.prototype.end = function(creep)
{
	
}

module.exports = Job;