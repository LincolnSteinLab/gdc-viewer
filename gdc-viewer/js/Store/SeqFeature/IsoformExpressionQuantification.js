/**
 * Base class for some Store SeqFeature for GDC
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
            splitLine = line.split('\t')
            // Second column contains location in the format refseq:chr:start-end:strand
            // This needs to be redistributed to form BED format
            featureLocation = splitLine[1]
            splitLocation = featureLocation.split(':')
            splitPos = splitLocation[2].split('-')
            locationArray = [splitLocation[1].replace('chr', ''), splitPos[0], splitPos[1]]
            splitLine.splice(1, 1)
            splitLine = locationArray.concat(splitLine)
            splitLine.splice(5, 0, splitLocation[3])
            return splitLine.join('\t')
        },

        getName: function() {
            return 'IsoformExpressionQuantification'
        }
    });
});