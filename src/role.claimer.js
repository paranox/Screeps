var BodyPartMap = require('creepBodyPartMap');
var Role = require('roleTypes');
var RoleBase = require('roleBase');

function Claimer()
{
    //console.log("Claimer.constructor()");
    this.roleName = "Claimer";

    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Claimer);

    this.minimumParts = [CLAIM, MOVE];
    this.partMap[CLAIM] = { type:BodyPartMap.Type.Weight, value:1 };
    this.partMap[MOVE] = { type:BodyPartMap.Type.PerOtherPart, value:1 };
}

/// Prototype

Claimer.prototype = Object.create(RoleBase);
Claimer.prototype.constructor = Claimer;

Claimer.prototype.getJob = function(actor)
{
    console.log(actor.creep.name + ": Claimer has nothing to do!");
    return null;
}

module.exports = Claimer.prototype;

/// Internal functions