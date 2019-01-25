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
            // Filters to apply to SSM query
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
         * Creates a link to a given ID
         * @param {string} link Base URL for link
         * @param {string} id ID to apped to base URL
         */
        createLinkWithId: function(link, id) {
            return id !== null ? "<a href='" + link + id + "' target='_blank'>" + id + "</a>" : "n/a";
        },

        /**
         * Create an array of links for COSMIC
         * @param {*} cosmic 
         */
        createCOSMICLinks: function(cosmic) {
            var thisB = this;

            var cosmicLinks = [];
            const COSMIC_LINK = 'https://cancer.sanger.ac.uk/cosmic/mutation/overview?id=';
            array.forEach(cosmic, function(cosmicId) {
                var cosmicIdNoPrefix = cosmicId.replace('COSM', '');
                cosmicLinks.push(thisB.createLinkWithId(COSMIC_LINK, cosmicIdNoPrefix));
            });

            return cosmicLinks.join(", ");
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

        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;

            // Setup query parameters
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');
            end = thisB.getChromosomeEnd(ref, end);

            var searchBaseUrl = 'https://api.gdc.cancer.gov/';

            // Create full url
            var url = searchBaseUrl + 'ssms';

            // Add filters to query
            url += '?filters=' + thisB.getFilterQuery(ref, start, end) + '&size=' + thisB.size;
            const GDC_LINK = 'https://portal.gdc.cancer.gov/ssms/';

            // Retrieve all mutations in the given chromosome range
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            }).then(function(results) {
                array.forEach(results.data.hits, function(variant) {
                    variantFeature = {
                        id: variant.id,
                        data: {
                            'start': variant.start_position,
                            'end': variant.end_position,
                            'GDC': thisB.createLinkWithId(GDC_LINK, variant.id),
                            'type': variant.mutation_type,
                            'Subtype': variant.mutation_subtype,
                            'Genomic DNA Change': variant.genomic_dna_change,
                            'COSMIC': thisB.createCOSMICLinks(variant.cosmic_id),
                            'Reference Allele': variant.reference_allele,
                            'Tumour Allele': variant.tumor_allele,
                            'NCBI Build': variant.ncbi_build,
                            'Chromosome': variant.chromosome,
                            'Gene AA Change': variant.gene_aa_change
                        }
                    }
                    featureCallback(new SimpleFeature(variantFeature));
                });

                finishCallback();
            }, function(err) {
                console.log(err);
                errorCallback('Error contacting GDC Portal');
            });
        },

        /**
         * Creates the filter for the query to only look at SSMs in the given range
         * @param {*} chr 
         * @param {*} start 
         * @param {*} end 
         */
        getLocationFilters: function(chr, start, end) {
            return({"op":"and","content":[{"op":">=","content":{"field":"start_position","value":start}},{"op":"<=","content":{"field":"end_position","value":end}},{"op":"=","content":{"field":"chromosome","value":['chr'+chr]}}]});
        }
    });
});