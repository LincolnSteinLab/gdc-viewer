/**
 * IsoformExpressionQuantification store class
 * See https://docs.gdc.cancer.gov/Data/Bioinformatics_Pipelines/miRNA_Pipeline/#mirna-expression-workflow
 * 
 * Supports (Data format, Data category, Data Type)
 * * TSV, Transcriptome Profiling, Isoform Expression Quantification
 * * TXT, Transcriptome Profiling, Isoform Expression Quantification
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
            // Second column contains location in the format refseq:chr:start-end:strand
            // This needs to be redistributed to form BED format
            // Create BED line
            featureLocation = originalLine[1];
            splitLocation = featureLocation.split(':');
            splitPos = splitLocation[2].split('-');
            locationArray = [splitLocation[1].replace('chr', ''), splitPos[0], splitPos[1]];

            bedLikeLine = locationArray;
            bedLikeLine.push(originalLine[0]) // name
            bedLikeLine.push(originalLine[2]) // score
            bedLikeLine.push(splitLocation[3]) // strand

            // Combine BED line and existing line
            fullLine = bedLikeLine.concat(originalLine)
            return fullLine.join('\t');
        },

        getName: function() {
            return 'IsoformExpressionQuantification';
        },
    });
});