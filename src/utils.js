﻿var utils =
{
    getBodyCost: function (bodyParts) {
        let cost = 0;
        bodyParts.forEach((bodyPart) =>
        {
            const part = typeof bodyPart === 'string' ? bodyPart : bodyPart.type;
            cost += BODYPART_COST[part];
        });

        return cost;
    },
    
    getBodyPartCost: function (part) {
        return BODYPART_COST[part];
    }
}

module.exports = utils;