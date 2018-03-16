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

Job.prototype.readSaveData = function(context, data)
{
	if (data.jobType == undefined)
	{
		console.log("Job save data has no job type defined!");
		return false;
	}
	else
		context.jobType = data.jobType;

	if (data.startTime != undefined)
	{
		context.startTime = data.startTime;
		context.hasStarted = data.startTime < Game.time;
	}
	else
		context.hasStarted = false;

	return true;
};

Job.prototype.createSaveData = function(context)
{
	return { "jobType": context.jobType, "startTime": context.startTime };
};

Job.prototype.start = function(actor)
{
	if (actor.doDebug)
		console.log(actor.creep.name + ": Job->" + this.jobName + "|" + this.jobType + ".start() at time " + Game.time);

	this.hasStarted = true;
	this.startTime = Game.time;
	this.onStart(actor);
};

Job.prototype.onStart = function(actor)
{
	actor.creep.say("Job Start!");
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
	if (actor.doDebug)
		console.log(actor.creep.name + ": Job->" + this.jobName + "|" + this.jobType + ".end(" + isDone + ")");

	this.hasEnded = true;
	this.onEnd(actor, isDone);
};

Job.prototype.onEnd = function(actor, isDone)
{
	if (isDone)
	{
		// Symbol Dec:10004, Hex:2714, HEAVY CHECK MARK, https://www.w3schools.com/charsets/ref_utf_symbols.asp
    	actor.creep.say("✔ Job done!");
	}
    else
    {
		// Symbol Dec:10008, Hex:2718, HEAVY BALLOT X, https://www.w3schools.com/charsets/ref_utf_symbols.asp
    	actor.creep.say("✘ Job fail!");
    }
};

module.exports = Job.prototype;