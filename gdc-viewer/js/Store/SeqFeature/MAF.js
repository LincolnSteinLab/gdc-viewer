const { unzip } = cjsRequire('@gmod/bgzf-filehandle');
/**
 * MAF store class
 * Supports (Data format, Data category, Data Type)
 * * MAF, Simple Nucleotide Variation, Aggregated Somatic Mutation
 * * MAF, Simple Nucleotide Variation, Annotated Somatic Mutation
 * * MAF, Simple Nucleotide Variation, Masked Aggregated Somatic Mutation
 * * MAF, Simple Nucleotide Variation, Masked Annotated Somatic Mutation
 */
define([
    'dojo/_base/declare',
    'gdc-viewer/Model/XHRBlob',
    'gdc-viewer/Store/SeqFeature/BaseBEDLikeFeature',
    'gdc-viewer/Util/SkipLastCtor',
    'JBrowse/Model/BlobFilehandleWrapper',
    'JBrowse/Util/TextIterator'
],
function(
    declare,
    XHRBlob,
    BaseBEDLikeFeature,
    SkipLastCtor,
    BlobFilehandleWrapper,
    TextIterator
) {
    return declare(SkipLastCtor(BaseBEDLikeFeature, 2), {

        constructor: function(args) {
            this.inherited(arguments);

            if (args.maf) {
                this.data = new BlobFilehandleWrapper(args.maf);
            } else if (args.urlTemplate) {
                this.data = new BlobFilehandleWrapper(
                    new XHRBlob(
                        this.resolveUrl(
                            args.urlTemplate
                        )
                    )
                );
            } else {
                throw new Error('must provide either `maf` or `urlTemplate`');
            }

            this.features = [];
            this._loadFeatures();
        },

        _loadFeatures: function() {
            // Override fetchLines() from JBrowse/Model/FileBlob
            this.data.fetchLines = (lineCallback, endCallback, failCallback) => {
                this.data.readFile().then(unzip).then((array) => {  // gunzip
                    const lineIterator = new TextIterator.FromBytes({
                        bytes: array,
                        returnPartialRecord: true
                    });
                    let line;
                    while (line = lineIterator.getline()) {
                        if (line.length == 0 || line[0] == '#') {
                            continue;
                        }
                        lineCallback(line);
                    }
                    endCallback();
                }).catch(failCallback);
            };
            this.inherited(arguments);
        },

        convertLineToBED: function(line) {
            const originalLine = line.split('\t');

            var bedLikeLine = [originalLine[4].replace('chr', '')];  // chr
            bedLikeLine.push(originalLine[5]);  // start
            bedLikeLine.push(originalLine[6]);  // end
            bedLikeLine.push(originalLine[0]);  // name
            bedLikeLine.push(null);  // score
            bedLikeLine.push(originalLine[7]);  // strand

            const fullLine = bedLikeLine.concat(originalLine);
            return fullLine.join('\t');
        },

        getName: function() {
            return 'MAF';
        }
    })
})
