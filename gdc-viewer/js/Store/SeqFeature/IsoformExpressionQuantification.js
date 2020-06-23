/**
 * Base class for some Store SeqFeature for GDC
 */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'JBrowse/Store/SeqFeature/BED',
    'JBrowse/Store/SeqFeature/BED/Parser',
    'JBrowse/Store/SeqFeature',
    'JBrowse/Model/XHRBlob',
    'JBrowse/Model/BlobFilehandleWrapper'

],
function (
    declare,
    array,
    lang,
    BED,
    Parser,
    SeqFeatureStore,
    XHRBlob,
    BlobFilehandleWrapper
) {
    return declare([ SeqFeatureStore, BED ], {
        downloadUrl: 'https://api.gdc.cancer.gov/data/',
        
        /**
         * Constructor
         * @param {*} args 
         */
        constructor: function (args) {
            // Unique file ID
            this.fileId = args.fileId;

            this.data = new BlobFilehandleWrapper(
                new XHRBlob(
                    this.resolveUrl(
                        this.downloadUrl + this.fileId
                    )
                )
            );
        },

        _loadFeatures: function () {
            var thisB = this;
            var features = this.bareFeatures = [];

            var featuresSorted = true;
            var seenRefs = this.refSeqs = {};
            var parser = new Parser(
                {
                    featureCallback: function (fs) {
                        array.forEach(fs, function (feature) {
                            var prevFeature = features[ features.length - 1 ];
                            var regRefName = thisB.browser.regularizeReferenceName(feature.seq_id);
                            if (regRefName in seenRefs && prevFeature && prevFeature.seq_id != feature.seq_id) {featuresSorted = false;}
                            if (prevFeature && prevFeature.seq_id == feature.seq_id && feature.start < prevFeature.start) {featuresSorted = false;}

                            if (!(regRefName in seenRefs)) {seenRefs[ regRefName ] = features.length;}

                            if (thisB.config.featureCallback) {
                                features.push(thisB.config.featureCallback(feature, thisB));
                            } else {
                                features.push(feature);
                            }
                        });
                    },
                    endCallback: function ()  {
                        if (!featuresSorted) {
                            features.sort(thisB._compareFeatureData);
                            // need to rebuild the refseq index if changing the sort order
                            thisB._rebuildRefSeqs(features);
                        }

                        thisB._estimateGlobalStats()
                            .then(function (stats) {
                                thisB.globalStats = stats;
                                thisB._deferred.stats.resolve();
                            });

                        thisB._deferred.features.resolve(features);
                    },
                    commentCallback: (this.config.commentCallback || function (i) {  }),
                    store: this
                });

            var fail = lang.hitch(this, '_failAllDeferred');
            // parse the whole file and store it
            let i = 0;
            this.data.fetchLines(
                function (line) {
                    try {
                        if (i !== 0) {
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
                            if (i > 0) {
                                parser.addLine(splitLine.join('\t'));
                            }
                        }
                        i++;
                    } catch (e) {
                        fail('Error parsing IsoFormExpressionQuantification.', e);
                        throw e;
                    }
                },
                lang.hitch(parser, 'finish'),
                fail
            );
        },

        /**
         * Stub for getParser
         */
        getParser: function() {
            return new Promise(function(resolve, reject) {
                resolve({'getMetadata': function() {}});
            });
        },
    });
});