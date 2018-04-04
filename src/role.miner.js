var BodyPartMap = require('creepBodyPartMap');
var Role = require('roleTypes');
var RoleBase = require('roleBase');
var RoleHarvester = require('role.harvester');

function Miner()
{
    //console.log("Miner.constructor()");
    this.roleName = Role.getNameOf(Role.Type.Miner);

    this.base = Object.create(RoleBase);
    this.base.constructor(this, Role.Type.Miner);

    this.partMap[WORK] = { type:BodyPartMap.Type.Weight, value:1.5 };
    this.partMap[CARRY] = { type:BodyPartMap.Type.Weight, value:1.0 };
    this.partMap[MOVE] = { type:BodyPartMap.Type.PerPartOfType, value:0.5, opts: { part:WORK } };
}

/// Prototype

Miner.prototype = Object.create(RoleBase);
Miner.prototype.constructor = Miner;

Miner.prototype.run = RoleHarvester.run;
Miner.prototype.getJob = RoleHarvester.getJob;

module.exports = Miner.prototype;