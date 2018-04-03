var Role = require('roleTypes');

module.exports =
{
	Type: Type = Object.freeze( { Home:0, Harvest:1, Haul:2, Expand:3 } ),
	isDefined: function(type) { return type >= 0 && type < Object.keys(this.Type).length; },
	getNameOf: function(index) { return Object.keys(this.Type)[index]; },

	/// Creates a role position object from parameters to use with an operation.
	/// Parameter priority can be either a Number or an array of Numbers
	/// In an array priority the index corresponds to current number of actors in role.
	/// If there are more actors than entries in the array, the last entry will be used.
	createRolePositionObject: function(roleType, current, min, max, priority)
	{
		var obj = { roleName:Role.getNameOf(roleType), roleType:roleType, current:current, min:min };

		if (max != undefined) obj["max"] = max;
		if (priority != undefined) obj["priority"] = priority;
		
		return obj;
	},

	/// Creates a role position object from data to use with an operation.
	createRolePositionFromData: function(roleData)
	{
		var obj = { roleName:roleData.roleName, roleType:Role.Type[roleData.roleName], current:roleData.current, min:roleData.min };

		if (roleData.max != undefined) obj["max"] = roleData.max;
		if (roleData.priority != undefined) obj["priority"] = roleData.priority;
		
		return obj;
	},

	/// Creates a role position save data object from actual role position object.
	createRoleDataFromPosition: function(rolePosition)
	{
		var obj = { roleName:rolePosition.roleName, roleType:rolePosition.roleType, current:rolePosition.current, min:rolePosition.min };

		if (rolePosition.max != undefined) obj["max"] = rolePosition.max;
		if (rolePosition.priority != undefined) obj["priority"] = rolePosition.priority;
		
		return obj;
	}
}