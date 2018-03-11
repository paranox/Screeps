var Role = require('rolePrototype');

function Builder()
{
    //console.log("Builder()");
    this.base = Role;
    this.base("Builder");

    this.partWeightMap[WORK] = 2.0;
    this.partWeightMap[CARRY] = 2.0;
    this.partWeightMap[MOVE] = 1.0;

    this.opts = { memory: { role: 'builder' } };
}

Builder.prototype = Object.create(Role);
Builder.prototype.constructor = Builder;

Builder.prototype.run = function(creep)
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

module.exports = Builder.prototype;