var Role = require('roleTypes');

// TODO: Investigate Object.assign() usage for merging
// Role.prototype with specific role prototype objects
// to simulate inheritance of classes better

function RoleBase(context, roleType)
{
	//console.log("Role.constructor(" + context.roleName + ")");

	context.roleType = roleType;
    context.opts = { memory: { role:Role.getNameOf(roleType) } };
	context.minimumParts = [WORK, CARRY, MOVE, MOVE];
    context.partMap = {};

	if (context.run == undefined) context.run = this.run;
    if (context.getJob == undefined) context.getJob = this.getJob;
	if (context.tryDoJob == undefined) context.tryDoJob = this.tryDoJob;
	if (context.end == undefined) context.end = this.end;
}

RoleBase.prototype.init = function(actor)
{
	if (actor.doDebug)
		console.log("Role->" + this.roleName + ".init(" + actor.creep.name + ")");
}

RoleBase.prototype.run = function(actor)
{
	if (actor.doDebug)
		console.log("Role->" + this.roleName + ".run(" + actor.creep.name + ")");

    if (this.tryDoJob(actor))
        return;

    var job;
    if (actor.operation != null)
    {
        job = actor.operation.getJob(actor);
        if (job != null)
        {
            actor.addJob(job);
            //this.tryDoJob(job);
            return;
        }
        //else
        //    console.log(actor.creep.name + ": Operation " + actor.operation.opName + " had no work, going solo!");
    }

    job = this.getJob(actor);
    if (job != null)
    {
        actor.addJob(job);
        //this.tryDoJob(job);
    }
}

RoleBase.prototype.getJob = function(actor)
{
    console.log(actor.creep.name + ": No job to get!");
    return null;
}

RoleBase.prototype.tryDoJob = function(actor)
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
}

RoleBase.prototype.end = function(actor)
{
	if (actor.doDebug)
		console.log("Role->" + this.roleName + ".end(" + actor.creep.name + ")");

	this.tryEndJob(actor);
}

RoleBase.prototype.tryEndJob = function(actor)
{
    if (actor.currentJob != undefined && actor.currentJob >= 0 && actor.currentJob < actor.jobs.length)
    {
    	var job = actor.jobs[actor.currentJob];
        job.end(actor);
        return true;
    }

    return false;
}

module.exports = RoleBase.prototype;