/**
 * SEG store class for CopyNumberSegment files
 * Supports (Data format, Data category, Data Type)
 * * TXT, Copy number variation, Copy number Segment
 * * TXT, Copy number variation, Masked copy number Segment
 * * TXT, Copy number variation, Allele-specific copy number Segment
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
