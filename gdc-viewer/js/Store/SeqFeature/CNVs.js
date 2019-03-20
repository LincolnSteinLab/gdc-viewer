define([
    'dojo/_base/declare',
    './BaseSeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    BaseSeqFeature,
    SimpleFeature
) {
    return declare(BaseSeqFeature, {
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
         * Converts the CNV change string to a numeric value
         * @param {string} cnvChange Gain or Loss
         * @return {number} 1 for gain or -1 for loss
         */
        convertCNVChangeToScore: function(cnvChange) {
            return cnvChange.toLowerCase() == 'gain' ? 1 : -1;
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
            var cnvQuery = `query cnvResults($filters: FiltersArgument) { explore { cnvs { hits(filters: $filters) { total edges { node { id cnv_id start_position end_position chromosome ncbi_build cnv_change } } } } } } `;
            var combinedFilters = thisB.getFilterQuery(ref, start, end);

            var bodyVal = {
                query: cnvQuery,
                variables: {
                    "size": thisB.size,
                    "offset": 0,
                    "filters": combinedFilters,
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
            fetch(thisB.graphQLUrl, {
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