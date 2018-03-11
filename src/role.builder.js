var Role = require('rolePrototype');

function RoleBuilder()
{
	this.base = Role;
	this.base("Builder");
}

RoleBuilder.prototype = Object.create(Role);
RoleBuilder.prototype.constructor = RoleBuilder;
RoleBuilder.prototype.init = function(creep)
{
	//this.base.init(creep);
	console.log(creep.name + ": " + this.name + " initialized!");
};

RoleBuilder.prototype.run = function(creep)
{
    if (creep.memory.building && creep.carry.energy == 0)
    {
        creep.memory.building = false;
        creep.say('☭ Harvesting...');
    }
    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity)
    {
        creep.memory.building = true;
        creep.say('⚒ Building...');
    }

    if (creep.memory.building)
    {
        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (targets.length)
        {
            if (creep.build(targets[0]) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
    else
    {
        var sources = creep.room.find(FIND_SOURCES);
        if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }
};

var roleBuilder =
{
    /** @param {Creep} creep **/
    /*run: function(creep)
    {

        if (creep.memory.building && creep.carry.energy == 0)
        {
	        creep.memory.building = false;
	        creep.say('☭ Harvesting...');
	    }
	    if (!creep.memory.building && creep.carry.energy == creep.carryCapacity)
	    {
	        creep.memory.building = true;
	        creep.say('⚒ Building...');
	    }

	    if (creep.memory.building)
	    {
	        var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
	        if (targets.length)
	        {
                if (creep.build(targets[0]) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
	    }
	    else
	    {
	        var sources = creep.room.find(FIND_SOURCES);
	        if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE)
	        {
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
	    }
	}*/

	processState: function(creep, state)
	{

	}
};

module.exports = RoleBuilder.prototype;