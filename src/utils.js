var utils =
{
    objectToString: function(obj, depth, maxDepth)
    {
        if (depth == undefined) depth = 0;
        if (maxDepth == undefined) maxDepth = 3;

        return "<" + depth + "/" + maxDepth + ">{" + (Object.keys(obj).map(key => {
            if (Array.isArray(obj[key]) && depth < maxDepth)
                return " " + key + ": " + this.arrayToString(obj[key], depth + 1, maxDepth);
            if (typeof obj[key] == "object" && depth < maxDepth)
                return " " + key + ": " + this.objectToString(obj[key], depth + 1, maxDepth);
            if (typeof obj[key] == "function")
                return " " + key + ": function()";
            return " " + key + ": " + obj[key];
        })) + " }";
    },

    arrayToString: function(array, depth, maxDepth)
    {
        if (depth == undefined) depth = 0;
        if (maxDepth == undefined) maxDepth = 3;

        return "<" + depth + "/" + maxDepth + ">[" + array.map(index => {
            if (Array.isArray(obj[key]) && depth < maxDepth)
                return this.arrayToString(array[index], depth + 1, maxDepth);
            if (typeof obj[key] == "object" && depth < maxDepth)
                return this.objectToString(array[index], depth + 1, maxDepth);
            if (typeof obj[key] == "function")
                return " " + key + ": function()";
            return " " + array[index];
        }) + " ]";
    },

    getBodyCost: function(bodyParts)
    {
        let cost = 0;
        bodyParts.forEach((bodyPart) =>
        {
            const part = typeof bodyPart === 'string' ? bodyPart : bodyPart.type;
            cost += BODYPART_COST[part];
        });

        return cost;
    },
    
    getBodyPartCost: function(part)
    {
        return BODYPART_COST[part];
    }
}

module.exports = utils;