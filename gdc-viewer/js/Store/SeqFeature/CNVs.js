define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/request',
    'JBrowse/Store/SeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    array,
    request,
    SeqFeatureStore,
    SimpleFeature
) {
    return declare(SeqFeatureStore, {
        constructor: function (args) {
            // Filters to apply to CNV query
            this.filters = args.filters !== undefined ? JSON.parse(args.filters) : [];
            this.size = args.size !== undefined ? parseInt(args.size) : 500;
        },

        /**
         * Creates a combined filter query based on the location and any filters passed
         * @param {*} chr 
         * @param {*} start 
         * @param {*} end 
         */
        getFilterQuery: function (chr, start, end) {
            var thisB = this;
            var resultingFilterQuery = {
                "op": "and",
                "content": [
                    thisB.getLocationFilters(chr, start, end)
                ]
            };
            if (Object.keys(thisB.filters).length > 0) {
                resultingFilterQuery.content.push(thisB.filters);
            }
            
            return encodeURI(JSON.stringify(resultingFilterQuery));
        },

        /**
         * Returns the end value to be used for querying GDC
         * @param {string} chr Chromosome number (ex. 1)
         * @param {integer} end End location of JBrowse view
         */
        getChromosomeEnd: function(chr, end) {
            var chromosomeSizes = {
                '1': 248956422,
                '2': 242193529,
                '3': 198295559,
                '4': 190214555,
                '5': 181538259,
                '6': 170805979,
                '7': 159345973,
                '8': 146364022,
                '9': 138394717,
                '10': 133797422,
                '11': 135086622,
                '12': 133275309,
                '13': 114364328,
                '14': 107043718,
                '15': 101991189,
                '16': 90338345,
                '17': 83257441,
                '18': 80373285,
                '19': 58617616,
                '20': 64444167,
                '21': 46709983,
                '22': 50818468,
                'x': 156040895,
                'y': 57227415
            };

            if (end > chromosomeSizes[chr]) {
                return chromosomeSizes[chr];
            } else {
                return end;
            }
        },

        /**
         * Converts the CNV change string to a numeric value
         * @param {*} cnvChange Gain or Loss
         */
        convertCNVChangeToScore: function(cnvChange) {
            cnvChange = cnvChange.toLowerCase();
            if (cnvChange == 'gain') {
                return 1;
            } else {
                return -1;
            }
        },

        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;

            // Setup query parameters
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');
            end = thisB.getChromosomeEnd(ref, end);

            var searchBaseUrl = 'https://api.gdc.cancer.gov/';

            // Create full url
            var url = searchBaseUrl + 'cnvs';

            // Add filters to query
            url += '?filters=' + thisB.getFilterQuery(ref, start, end) + '&size=' + thisB.size;

            // Retrieve all mutations in the given chromosome range
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            }).then(function(results) {
                array.forEach(results.data.hits, function(cnv) {
                    cnvFeature = {
                        id: cnv.id,
                        data: {
                            'start': cnv.start_position,
                            'end': cnv.end_position,
                            'score': thisB.convertCNVChangeToScore(cnv.cnv_change)
                        }
                    }
                    featureCallback(new SimpleFeature(cnvFeature));
                });

                finishCallback();
            }, function(err) {
                console.log(err);
                errorCallback('Error contacting GDC Portal');
            });
        },
        
        /**
         * Creates the filter for the query to only look at CNVs in the given range
         * @param {*} chr 
         * @param {*} start 
         * @param {*} end 
         */
        getLocationFilters: function(chr, start, end) {
            return({"op":"and","content":[{"op":">=","content":{"field":"start_position","value":start}},{"op":"<=","content":{"field":"end_position","value":end}},{"op":"=","content":{"field":"chromosome","value":[chr]}}]});
        }
    });
});