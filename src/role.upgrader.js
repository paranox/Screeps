﻿var BodyPartMap = require('creepBodyPartMap');
var Role = require('roleTypes');
var RoleBase = require('roleBase');
var JobPrototypeResupply = require('job.resupply');
var Job = require('jobTypes');

//var UpgraderState = Object.freeze({ Error: -1, Idle: 0, SeekSource: 1, Harvest: 2, Upgrade: 3 });

/// Constructor

function Upgrader()
{
    //console.log("Upgrader.constructor()");
    this.roleName = "Upgrader";
    
    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Upgrader);

    this.partMap[WORK] = { type:BodyPartMap.Type.Weight, value:2.0 };
    this.partMap[CARRY] = { type:BodyPartMap.Type.Weight, value:1.0 };
    this.partMap[MOVE] = { type:BodyPartMap.Type.PerPartOfType, value:1, opts: { part:WORK } };

    this.opts.memory.resupplyThreshold = 1250;
}

/// Prototype

Upgrader.prototype = Object.create(RoleBase);
Upgrader.prototype.constructor = Upgrader;

Upgrader.prototype.run = function(actor)
{
    if (this.tryDoJob(actor))
        return;

    var job = getJob(actor);
    if (job != null)
        actor.addJob(job);
}

module.exports = Upgrader.prototype;

/// Internal functions

function getJob(actor)
{
    // No energy, go get some
    if (actor.creep.carry.energy == 0)
    {
        var target = JobPrototypeResupply.getResupplyTarget(actor);

        if (target)
            return Game.empire.factories.job.createFromType(Job.Type.Resupply, { "for": actor.creep.name, "target": target });

        return Game.empire.factories.job.createFromType(Job.Type.Harvest, { "for": actor.creep.name });
    }

    // Get the room's Controller for an Upgrade job
    var controller = actor.creep.room.controller;
    if (controller != null)
        return Game.empire.factories.job.createFromType(Job.Type.Upgrade, { "for": actor.creep.name });
    else
        console.log(actor.creep.name + ": Can't find Controller in room " + actor.creep.room + "!");

    return null;
}