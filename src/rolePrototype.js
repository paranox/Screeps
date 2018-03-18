// TODO: Investigate Object.assign() usage for merging
// Role.prototype with specific role prototype objects
// to simulate inheritance of classes better

function Role(context, roleType)
{
	//console.log("Role.constructor(" + context.roleName + ")");

	context.roleType = roleType;
    context.opts = { memory: { "role": roleType } };
	context.minimumParts = [WORK, CARRY, MOVE];
    context.partWeightMap = {};

	if (context.run == undefined) context.run = this.run;
	if (context.tryDoJob == undefined) context.tryDoJob = this.tryDoJob;
	if (context.end == undefined) context.end = this.end;
};

Role.prototype.init = function(actor)
{
	if (actor.doDebug)
		console.log("Role->" + this.roleName + ".init(" + actor.creep.name + ")");
};

Role.prototype.run = function(actor)
{
	if (actor.doDebug)
		console.log("Role->" + this.roleName + ".run(" + actor.creep.name + ")");

	this.tryDoJob(actor);
};

Role.prototype.end = function(actor)
{
	if (actor.doDebug)
		console.log("Role->" + this.roleName + ".end(" + actor.creep.name + ")");
};

Role.prototype.tryDoJob = function(actor)
{
    if (actor.currentJob != undefined && actor.currentJob >= 0 && actor.currentJob < actor.jobs.length)
    {
    	var job = actor.jobs[actor.currentJob];
    	if (job.hasStarted == false)
    		job.start(actor);

        job.update(actor);
        return true;
    }

    return false;
};

module.exports = Role.prototype;