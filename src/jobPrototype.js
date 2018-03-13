function Job(jobType, jobName)
{
	console.log("Job.constructor<" + jobType + "(" + jobName + ")");
	this.jobType = jobType;
	this.jobName = jobName;
	this.hasEnded = false;
};

Job.prototype.readSaveData = function(data)
{
	console.log(creep.name + ": Job<" + this.jobType + ">(" + this.jobName + ")  has no need for data!");
	return false;
}

Job.prototype.setIndex = function(jobIndex)
{
	this.jobIndex = jobIndex;
};

Job.prototype.createSaveData = function()
{
	return { "jobType": this.jobType };
};

Job.prototype.start = function(creep)
{
	
};

Job.prototype.run = function(creep)
{
	console.log(creep.name + ": Job<" + this.jobType + ">(" + this.jobName + ") doesn't require any work!");
};

Job.prototype.end = function(creep, isDone)
{
	this.hasEnded = true;

	if (isDone)
    	creep.say("❓ Job done!");
    else
    	creep.say("❓ Job fail!");
};

module.exports = Job.prototype;