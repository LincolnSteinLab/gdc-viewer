/**
 * SEG store class for CopyNumberSegment files
 * Supports (Data format, Data category, Data Type)
 * * TXT, Copy Number Variation, Copy Number Segment
 * * TXT, Copy Number Variation, Masked Copy Number Segment
 * * TXT, Copy Number Variation, Allele-specific Copy Number Segment
 */
define([
    'dojo/_base/declare',
    './BaseBEDLikeFeature',
],
function (
    declare,
    BaseBEDLikeFeature
) {
    return declare(BaseBEDLikeFeature, {
        convertLineToBED: function(line) {
            return line = line.slice(line.indexOf('\t') + 1);
        },

        getName: function() {
            return 'SEG'
        }
    });
});
