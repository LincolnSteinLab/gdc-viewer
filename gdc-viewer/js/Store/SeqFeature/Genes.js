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
            // Filters to apply to Gene query
            this.filters = args.filters !== undefined ? JSON.parse(args.filters) : [];
            // Size of results
            this.size = args.size !== undefined ? parseInt(args.size) : 500;
            // Case ID
            this.case = args.case;
        },

        /**
         * Creates a combined filter query based on the location and any filters passed
         * @param {*} chr Chromosome to filter by
         * @param {*} start the start position
         * @param {*} end the end position
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
            return(resultingFilterQuery);
        },

         /**
         * Creates a link to a given ID
         * @param {string} link Base URL for link
         * @param {string} id ID to append to base URL
         * @return {string} a tag
         */
        createLinkWithId: function(link, id) {
            return id !== null ? "<a href='" + link + id + "' target='_blank'>" + id + "</a>" : "n/a";
        },

        /**
         * Creates a link to a given ID and name
         * @param {string} link Base URL for link
         * @param {string} id ID to apped to base URL
         * @param {string} name text to display for link
         * @return {string} a tag
         */
        createLinkWithIdAndName: function(link, id, name) {
            return id !== null ? "<a href='" + link + id + "' target='_blank'>" + name + "</a>" : "n/a";
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
         * Creates the query object for graphQL call
         * @param {*} ref chromosome
         * @param {*} start start position
         * @param {*} end end position
         * @return {object} query object
         */
        createQuery: function(ref, start, end) {
            var thisB = this;
            var geneQuery = `query geneResultsTableQuery( $genesTable_filters: FiltersArgument $genesTable_size: Int $genesTable_offset: Int $score: String ) { genesTableViewer: viewer { explore { genes { hits(first: $genesTable_size, offset: $genesTable_offset, filters: $genesTable_filters, score: $score) { total edges { node { gene_id id gene_strand synonyms symbol name gene_start gene_end gene_chromosome description canonical_transcript_id canonical_transcript_length canonical_transcript_length_genomic canonical_transcript_length_cds is_cancer_gene_census cytoband biotype numCases: score is_cancer_gene_census } } } } } } }`;
            var combinedFilters = thisB.getFilterQuery(ref, start, end);

            var bodyVal = {
                query: geneQuery,
                variables: {
                    "genesTable_filters": combinedFilters,
                    "genesTable_size": thisB.size,
                    "genesTable_offset": 0,
                    "score": "case.project.project_id"
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

            var url = 'https://api.gdc.cancer.gov/v0/graphql/GenesTable';

            const ENSEMBL_LINK = 'http://www.ensembl.org/id/';
            const GDC_LINK = 'https://portal.gdc.cancer.gov/genes/';

            var bodyVal = JSON.stringify(thisB.createQuery(ref, start, end));
            fetch(url, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: bodyVal
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                if (response.data) {
                    for (var hitId in response.data.genesTableViewer.explore.genes.hits.edges) {
                        var gene = response.data.genesTableViewer.explore.genes.hits.edges[hitId].node;
                        geneFeature = {
                            id: gene.gene_id,
                            data: {
                                'start': gene.gene_start,
                                'end': gene.gene_end,
                                'strand': gene.gene_strand,
                                'Gene Description': gene.description,
                                'Gene Name': gene.name,
                                'Symbol': gene.symbol,
                                'GDC': thisB.createLinkWithId(GDC_LINK, gene.gene_id),
                                'Ensembl': thisB.createLinkWithId(ENSEMBL_LINK, gene.gene_id),
                                'Biotype': gene.biotype,
                                'Synonyms': gene.synonyms,
                                'Canonical Transcript ID': thisB.createLinkWithId(ENSEMBL_LINK, gene.canonical_transcript_id),
                                'Canonical Transcript Length': gene.canonical_transcript_length,
                                'Cytoband': gene.cytoband,
                                'Canonical Transcript Length Genomic': gene.canonical_transcript_length_genomic,
                                'Canonical Transcript Length CDS': gene.canonical_transcript_length_cds,
                                'Is Cancer Gene Census': gene.is_cancer_gene_census,
                            }
                        }
                        featureCallback(new SimpleFeature(geneFeature));
                    }
                    finishCallback();
                }
            }).catch(function(err) {
                console.log(err);
                errorCallback('Error contacting GDC Portal');
            });
        },

        /**
         * Creates the filter for the query to only look at Genes in the given range
         * @param {*} chr chromosome
         * @param {*} start start position
         * @param {*} end end position
         */
        getLocationFilters: function(chr, start, end) {
            var thisB = this;
            var locationFilter = {"op":"and","content":[{"op":">=","content":{"field":"genes.gene_start","value":start}},{"op":"<=","content":{"field":"genes.gene_end","value":end}},{"op":"=","content":{"field":"genes.gene_chromosome","value":[chr]}}]};
            if (thisB.case) {
                var caseFilter = {"op":"in","content":{"field": "cases.case_id","value": thisB.case}};
                locationFilter.content.push(caseFilter);
            }
            return(locationFilter);
        }
    });
});