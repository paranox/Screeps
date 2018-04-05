var Utils = require('utils');
var Empire = require('empire');
var Role = require('roleTypes');

module.exports.loop = function ()
{
    const doDebug = false;

    for (var name in Memory.creeps)
    {
        if (!Game.creeps[name])
        {
            var id = Memory.creeps[name].id;
            console.log("Removing non-existing creep from memory: name: " + name + ", id: " + id);
            delete Memory.creeps[name];
        }
    }

    Empire.init();
    Empire.readData();

    /// Tick starts

    Empire.onTickStart();

    //console.log("Actor phase init!");

    var actor, op;

    for (var id in Game.empire.operations)
    {
        op = Game.empire.operations[id];
        //console.log("Operation " + id + "(" + op.opType + "), starting...");
        op.start();
    }

    /// Tick update

    for (var id in Game.empire.operations)
    {
        op = Game.empire.operations[id];
        //console.log("Operation " + id + "(" + op.opType + "), updating...");
        op.update();
    }

    for (var id in Game.empire.actors)
    {
        actor = Game.empire.actors[id];
        actor.run();
    }

    // Tick end

    for (var id in Game.empire.actors)
    {
        actor = Game.empire.actors[id];
        actor.end();
    }

    for (var id in Game.empire.operations)
    {
        op = Game.empire.operations[id];
        //console.log("Operation " + id + "(" + op.opType + "), end of tick");
        op.end();
    }
    
    /// Commit to memory ///

    Empire.onTickEnd();
}