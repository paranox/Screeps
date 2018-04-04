﻿var Role = require('roleTypes');
var roleBuilder = require('role.builder');
var roleMiner = require('role.miner');
var roleRepairer = require('role.repairer');
var roleUpgrader = require('role.upgrader');
var roleSupplier = require('role.supplier');
var roleClaimer = require('role.claimer');
var roleHarvester = require('role.harvester');

module.exports = 
{
	initPrototypes: function()
	{
		//console.log("Initializing role prototypes!");
		this.prototypeBuilder = Object.create(roleBuilder);
		this.prototypeBuilder.constructor();
		this.prototypeMiner = Object.create(roleMiner);
		this.prototypeMiner.constructor();
		this.prototypeRepairer = Object.create(roleRepairer);
		this.prototypeRepairer.constructor();
		this.prototypeUpgrader = Object.create(roleUpgrader);
		this.prototypeUpgrader.constructor();
		this.prototypeSupplier = Object.create(roleSupplier);
		this.prototypeSupplier.constructor();
		this.prototypeClaimer = Object.create(roleClaimer);
		this.prototypeClaimer.constructor();
		this.prototypeHarvester = Object.create(roleHarvester);
		this.prototypeHarvester.constructor();
	},

	getPrototype: function(role)
	{
		//console.log("Getting prototype for role " + role);
	    switch (role)
	    {
	        case Role.Type.Builder:
	            return this.prototypeBuilder;
	        case Role.Type.Miner:
	            return this.prototypeMiner;
	        case Role.Type.Repairer:
	            return this.prototypeRepairer;
	        case Role.Type.Upgrader:
	            return this.prototypeUpgrader;
            case Role.Type.Supplier:
            	return this.prototypeSupplier;
        	case Role.Type.Claimer:
        		return this.prototypeClaimer;
	        case Role.Type.Harvester:
	            return this.prototypeHarvester;
	    }

	    console.log("Unhandled Role[" + role + "]: " + Role.getNameOf(role) + ", can't find prototype!");
	    return null;
	}
};