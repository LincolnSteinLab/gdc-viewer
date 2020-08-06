/**
 * MethylationBetaValue store class
 * Supports (Data format, Data category, Data Type)
 * * TXT, DNA Methlyation, Methylation Beta Value
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
        // Composite Element REF	Beta_value	Chromosome	Start	End	Gene_Symbol	Gene_Type	Transcript_ID	Position_to_TSCGI_Coordinate	Feature_Type
        // cg00000292	0.713849646891845	chr16	28878779	28878780	ATP2A1;ATP2A1;ATP2A1;ATP2A1;ATP2A1	protein_coding;protein_coding;protein_coding;protein_coding;protein_coding	ENST00000357084.6;ENST00000395503.7;ENST00000536376.4;ENST00000562185.4;ENST00000563975.1	373;290;-1275;-465;-83	CGI:chr16:28879633-28880547	N_Shore
        convertLineToBED: function(line) {
            originalLine = line.split('\t');

            bedLikeLine = [originalLine[2].replace('chr', '')];  // chr
            bedLikeLine.push(originalLine[3]);  // start
            bedLikeLine.push(originalLine[4]);  // end
            bedLikeLine.push(originalLine[0]);  // name
            bedLikeLine.push(originalLine[1]);  // score
            bedLikeLine.push(null);  // strand

            fullLine = bedLikeLine.concat(originalLine);
            return fullLine.join('\t');
        },

        getName: function() {
            return 'GeneLevelCopyNumber'
        }
    })
})
