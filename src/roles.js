var roleType = require('roleTypes');
var roleBuilder = require('role.builder');
var roleHarvester = require('role.harvester');
var roleRepairer = require('role.repairer');
var roleUpgrader = require('role.upgrader');

module.exports = 
{
	initPrototypes: function()
	{
		//console.log("Initializing role prototypes!");
		this.prototypeBuilder = Object.create(roleBuilder);
		this.prototypeBuilder.constructor();
		this.prototypeHarvester = Object.create(roleHarvester);
		this.prototypeHarvester.constructor();
		this.prototypeRepairer = Object.create(roleRepairer);
		this.prototypeRepairer.constructor();
		this.prototypeUpgrader = Object.create(roleUpgrader);
		this.prototypeUpgrader.constructor();
	},

	getPrototype: function(role)
	{
		//console.log("Getting prototype for role " + role + "(" + (typeof role) + ")");
	    switch (role)
	    {
	        case roleType.Builder:
	            return this.prototypeBuilder;
	        case roleType.Harvester:
	            return this.prototypeHarvester;
	        case roleType.Repairer:
	            return this.prototypeRepairer;
	        case roleType.Upgrader:
	            return this.prototypeUpgrader;
	    }

	    console.log("Unhandled role " + role + ", can't find prototype!");
	}
};