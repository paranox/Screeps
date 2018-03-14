// TODO: Investigate Object.assign() usage for merging
// Role.prototype with specific role prototype objects
// to simulate inheritance of classes better

function Role(context, roleType)
{
	//console.log("Role.constructor(" + context.roleName + ")");

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

Role.prototype.tryDoJob = function(actor)
{
    if (actor.currentJob != null)
    {
    	if (actor.currentJob.hasStarted == false)
    		actor.currentJob.start(actor);

        actor.currentJob.update(actor);
        return true;
    }

    return false;
};

Role.prototype.end = function(actor)
{
	if (actor.doDebug)
		console.log("Role->" + this.roleName + ".end(" + actor.creep.name + ")");
};

module.exports = Role.prototype;