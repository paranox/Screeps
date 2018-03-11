function Role(roleName)
{
	console.log("Role(" + roleName + ")");
	this.roleName = roleName;
};

Role.prototype.init = function(creep)
{
	console.log(this.roleName + ": I'm alive!");
	//setState(creep.memory.state);
}

Role.prototype.run = function(creep)
{
	console.log(creep.name + ": " + this.roleName + " can't do anything!");
}

module.exports = Role;

/*module.exports =
{
	init: function(creep)
	{
		setState(creep.memory.state);
	}

	run: function(creep)
	{
		processState(creep, this.state);
	};

	getState: function()
	{
		return this.state;
	};

	setState: function(state)
	{
		this.state = state;
	};

	processState: function(creep, state)
	{
		console.log(creep.name + ": Base prorotype does nothing in state " + state);
	};
}*/