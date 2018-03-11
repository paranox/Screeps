var roleType = require('roleTypes');
var roleBuilder = require('role.builder');
var roleHarvester = require('role.harvester');
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
	        case roleType.Upgrader:
	            return this.prototypeUpgrader;
	    }
	}
};