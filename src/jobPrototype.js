function Job(context)
{
	//console.log("Job.constructor(" + context.jobName + "|" + context.jobType + ")");
	this.context = context;

	context.hasStarted = false;
	context.hasEnded = false;

	if (context.setIndex == undefined)
		context.setIndex = this.setIndex;
	if (context.readSaveData == undefined)
		context.readSaveData = this.readSaveData;
	if (context.createSaveData == undefined)
		context.createSaveData = this.createSaveData;

	if (context.start == undefined)
		context.start = this.start;
	if (context.run == undefined)
		context.run = this.run;
	if (context.end == undefined)
		context.end = this.end;
};

Job.prototype.setIndex = function(jobIndex)
{
	this.jobIndex = jobIndex;
};

Job.prototype.readSaveData = function(data)
{
	if (data.jobType == undefined)
	{
		console.log("Job save data has no job type defined!");
		return false;
	}
	
	this.jobType = data.jobType;
	return true;
};

Job.prototype.createSaveData = function()
{
	return { "jobType": this.jobType };
};

Job.prototype.start = function(actor)
{
	//console.log(actor.creep.name + ": Job->" + this.jobName + "|" + this.jobType + ".start()");
	this.hasStarted = true;
	this.onStart(actor);
};

Job.prototype.onStart = function(actor)
{
	
};

Job.prototype.update = function(actor)
{
	//console.log(actor.creep.name + ": Job->" + this.jobName + "|" + this.jobType + ".update()");
	this.onUpdate(actor);
};

Job.prototype.onUpdate = function(actor)
{
	console.log(actor.creep.name + ": Job<" + this.jobType + ">(" + this.jobName + ") doesn't require any work!");
};

Job.prototype.end = function(actor, isDone)
{
	//console.log(actor.creep.name + ": Job->" + this.jobName + "|" + this.jobType + ".end(" + isDone + ")");
	this.hasEnded = true;
	this.onEnd(actor, isDone);
};

Job.prototype.onEnd = function(actor, isDone)
{
	if (isDone)
    	actor.creep.say("❓ Job done!");
    else
    	actor.creep.say("❓ Job fail!");
};

module.exports = Job.prototype;