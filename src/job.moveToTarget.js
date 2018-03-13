var Job = require('jobPrototype');

function MoveToTarget(target)
{
    //console.log("Upgrader()");
    this.base = Job;
    this.base("MoveToTarget");

    this.target = target;
}

MoveToTarget.prototype = Object.create(Job);
MoveToTarget.prototype.constructor = MoveToTarget;

module.exports = MoveToTarget.prototype;