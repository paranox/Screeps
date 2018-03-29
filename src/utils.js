var utils =
{
    objectToString: function(obj, depth, maxDepth)
    {
        if (obj == undefined)
            return "<" + depth + "/" + maxDepth + ">undefined";
        if (obj == null)
            return "<" + depth + "/" + maxDepth + ">null";

        if (depth == undefined) depth = 0;
        if (maxDepth == undefined) maxDepth = 3;

        let keys = (Object.keys(obj));
        if (keys.length == 0)
            return "<" + depth + "/" + maxDepth + ">{}";

        return "<" + depth + "/" + maxDepth + ">{" + keys.map(key => {
            if (Array.isArray(obj[key]) && depth < maxDepth)
                return " " + key + ": " + this.arrayToString(obj[key], depth + 1, maxDepth);
            if (typeof obj[key] == "object" && depth < maxDepth)
                return " " + key + ": " + this.objectToString(obj[key], depth + 1, maxDepth);
            if (typeof obj[key] == "function")
                return " " + key + ": function()";
            return " " + key + ": " + obj[key];
        }) + " }";
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

    roundTo: function(value, decimalPlaces)
    {
        let mult = Math.pow(10, decimalPlaces);
        return Math.round(value * mult) / mult;
    },

    getBodyCost: function(bodyParts)
    {
        if (!bodyParts)
            return 0;

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