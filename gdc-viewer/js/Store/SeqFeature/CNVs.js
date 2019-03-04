define([
    'dojo/_base/declare',
    'JBrowse/Store/SeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    SeqFeatureStore,
    SimpleFeature
) {
    return declare(SeqFeatureStore, {
        /**
         * Constructor
         * @param {*} args 
         */
        constructor: function (args) {
            // Filters to apply to CNV query
            this.filters = args.filters !== undefined ? JSON.parse(args.filters) : [];
            // Size of results
            this.size = args.size !== undefined ? parseInt(args.size) : 500;
            // Case ID
            this.case = args.case;
        },

        /**
         * Creates a combined filter query based on the location and any filters passed
         * @param {*} chr chromosome to filter by
         * @param {*} start start position
         * @param {*} end end position
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
            
            return resultingFilterQuery;
        },

        /**
         * Returns the end value to be used for querying GDC
         * @param {string} chr Chromosome number (ex. 1)
         * @param {integer} end End location of JBrowse view
         * @return {int} end position
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
         * @param {string} cnvChange Gain or Loss
         * @return {number} 1 for gain or -1 for loss
         */
        convertCNVChangeToScore: function(cnvChange) {
            cnvChange = cnvChange.toLowerCase();
            if (cnvChange == 'gain') {
                return 1;
            } else {
                return -1;
            }
        },

        /**
         * Creates the query object for graphQL call
         * @param {*} ref chromosome
         * @param {*} start start position
         * @param {*} end end position
         * @return {object} query object
         */
        createQuery: function(ref, start, end) {
            var thisB = this;
            var cnvQuery = `query cnvResults($filters_1: FiltersArgument) { explore { cnvs { hits(filters: $filters_1) { total edges { node { id cnv_id start_position end_position chromosome ncbi_build cnv_change } } } } } } `;
            var combinedFilters = thisB.getFilterQuery(ref, start, end);

            var bodyVal = {
                query: cnvQuery,
                variables: {
                    "size": thisB.size,
                    "offset": 0,
                    "filters_1": combinedFilters,
                }
            }

            return bodyVal;
        },

        /**
         * Get the features to be displayed
         * @param {*} query 
         * @param {*} featureCallback 
         * @param {*} finishCallback 
         * @param {*} errorCallback 
         */
        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;

            // Setup query parameters
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');
            end = thisB.getChromosomeEnd(ref, end);

            var bodyVal = JSON.stringify(thisB.createQuery(ref, start, end));
            var url = 'https://api.gdc.cancer.gov/v0/graphql';
            fetch(url, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: bodyVal
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                if (response.data) {
                    for (var hitId in response.data.explore.cnvs.hits.edges) {
                        var cnv = response.data.explore.cnvs.hits.edges[hitId].node;
                        cnvFeature = {
                            id: cnv.id,
                            data: {
                                'start': cnv.start_position,
                                'end': cnv.end_position,
                                'score': thisB.convertCNVChangeToScore(cnv.cnv_change)
                            }
                        }
                        featureCallback(new SimpleFeature(cnvFeature));
                    }
                    finishCallback();
                }
            }).catch(function(err) {
                console.log(err);
                errorCallback('Error contacting GDC Portal');
            });
        },
        
        /**
         * Creates the filter for the query to only look at CNVs in the given range
         * @param {*} chr chromosome
         * @param {*} start start position
         * @param {*} end end position
         */
        getLocationFilters: function(chr, start, end) {
            var thisB = this;
            var locationFilter = {"op":"and","content":[{"op":">=","content":{"field":"cnvs.start_position","value":start}},{"op":"<=","content":{"field":"cnvs.end_position","value":end}},{"op":"=","content":{"field":"cnvs.chromosome","value":[chr]}}]};
            if (thisB.case) {
                var caseFilter = {"op":"in","content":{"field": "cases.case_id","value": thisB.case}};
                locationFilter.content.push(caseFilter);
            }
            return(locationFilter);
        }
    });
});