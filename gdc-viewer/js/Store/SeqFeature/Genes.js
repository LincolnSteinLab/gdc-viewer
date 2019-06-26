/**
 * Store SeqFeature for GDC Genes
 */
define([
    'dojo/_base/declare',
    './BaseSeqFeature',
    '../../Model/GeneFeature'
],
function(
    declare,
    BaseSeqFeature,
    GeneFeature
) {
    return declare(BaseSeqFeature, {
        projects: undefined,
        genes: undefined,

        /**
         * Constructor
         * @param {*} args 
         */
        constructor: function (args) {
            // Filters to apply to Gene query
            this.filters = args.filters !== undefined ? JSON.parse(args.filters) : [];
            // Size of results
            this.size = args.size !== undefined ? parseInt(args.size) : 100;
            // Case ID
            this.case = args.case;
        },

        /**
         * Creates the query object for graphQL call
         * @param {string} ref chromosome
         * @param {number} start start position
         * @param {number} end end position
         * @return {object} query object
         */
        createQuery: function(ref, start, end) {
            var thisB = this;
            var geneQuery = `query geneResultsTableQuery( $geneFilters: FiltersArgument $geneSize: Int $geneOffset: Int $score: String ) { genesTableViewer: viewer { explore { genes { hits(first: $geneSize, offset: $geneOffset, filters: $geneFilters, score: $score) { total edges { node { gene_id id gene_strand synonyms symbol name gene_start gene_end gene_chromosome description canonical_transcript_id external_db_ids { hgnc omim_gene uniprotkb_swissprot entrez_gene } biotype numCases: score is_cancer_gene_census } } } } } } }`;
            var combinedFilters = thisB.getFilterQuery(ref, start, end);

            var bodyVal = {
                query: geneQuery,
                variables: {
                    "geneFilters": combinedFilters,
                    "geneSize": thisB.size,
                    "geneOffset": 0,
                    "score": "case.project.project_id"
                }
            }

            return bodyVal;
        },

        /**
         * Creates a gene feature with the given gene object
         * @param {object} gene Gene object returned by GDC GraphQL
         * @param {function} featureCallback 
         */
        createGeneFeature: function(gene, featureCallback) {
            var thisB = this;
            const ENSEMBL_LINK = 'http://www.ensembl.org/id/';
            const GDC_LINK = 'https://portal.gdc.cancer.gov/genes/';
            const NCBI_LINK = 'http://www.ncbi.nlm.nih.gov/gene/';
            const UNI_LINK = 'http://www.uniprot.org/uniprot/';
            const HGNC_LINK = 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/';
            const OMIM_LINK = 'https://www.omim.org/entry/';
            geneFeature = {
                id: gene.gene_id,
                data: {
                    'start': thisB.prettyText(gene.gene_start),
                    'end': thisB.prettyText(gene.gene_end),
                    'strand': thisB.prettyText(gene.gene_strand),
                    'type': 'Gene',
                    'about': {
                        'biotype': thisB.prettyText(gene.biotype),
                        'gene name': thisB.prettyText(gene.name),
                        'id': thisB.prettyText(gene.gene_id),
                        'symbol': thisB.prettyText(gene.symbol),
                        'synonyms': thisB.prettyText(gene.synonyms),
                        'description': thisB.prettyText(gene.description)
                    },
                    'references': {
                        'ncbi gene': thisB.createLinkWithId(NCBI_LINK, gene.external_db_ids.entrez_gene),
                        'uniprotkb swiss-prot': thisB.createLinkWithId(UNI_LINK, gene.external_db_ids.uniprotkb_swissprot),
                        'hgnc': thisB.createLinkWithId(HGNC_LINK, gene.external_db_ids.hgnc),
                        'omim': thisB.createLinkWithId(OMIM_LINK, gene.external_db_ids.omim_gene),
                        'ensembl': thisB.createLinkWithId(ENSEMBL_LINK, gene.gene_id),
                        'canonical transcript id': thisB.createLinkWithId(ENSEMBL_LINK, gene.canonical_transcript_id),
                        'gdc': thisB.createLinkWithId(GDC_LINK, gene.gene_id)
                    },
                    'projects': gene.gene_id
                }
            }
            featureCallback(new GeneFeature(geneFeature));
        },

        /**
         * Get the features to be displayed
         * @param {object} query 
         * @param {function} featureCallback 
         * @param {function} finishCallback 
         * @param {function} errorCallback 
         */
        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;

            // Setup query parameters
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');
            end = thisB.getChromosomeEnd(ref, end);

            // Create the body for the Gene request
            var bodyVal = JSON.stringify(thisB.createQuery(ref, start, end));
            thisB.genes = [];

            // Fetch Genes and create features
            fetch(thisB.graphQLUrl + '/GenesTable', {
                    method: 'post',
                    headers: { 'X-Requested-With': null },
                    body: bodyVal
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                if (response.data) {
                    thisB.genes = response.data.genesTableViewer.explore.genes.hits.edges;
                    for (var hitId in thisB.genes) {
                        var gene = thisB.genes[hitId].node;
                        thisB.createGeneFeature(gene, featureCallback);
                    }
                    finishCallback();
                } else {
                    errorCallback('Error contacting GDC Portal');
                }
            }).catch(function(err) {
                console.log(err);
                errorCallback('Error contacting GDC Portal');
            });
        },

        /**
         * Creates the filter for the query to only look at Genes in the given range
         * @param {string} chr chromosome
         * @param {number} start start position
         * @param {number} end end position
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