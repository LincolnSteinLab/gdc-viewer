/**
 * GeneLevelCopyNumber store class
 * Supports (Data format, Data category, Data Type)
 * * TSV, Copy Number Variation, Gene Level Copy Number
 * * TXT, Copy Number Variation, Gene Level Copy Number
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
            originalLine = line.split('\t');

            bedLikeLine = [originalLine[2].replace('chr', '')];  // chr
            bedLikeLine.push(originalLine[3]);  // start
            bedLikeLine.push(originalLine[4]);  // end
            bedLikeLine.push(originalLine[1]);  // name
            bedLikeLine.push(originalLine[5]);  // score
            bedLikeLine.push(null);  // strand

            fullLine = bedLikeLine.concat(originalLine);
            return fullLine.join('\t');
        },

        getName: function() {
            return 'GeneLevelCopyNumber'
        }
    })
})
