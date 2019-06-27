/**
 * Store SeqFeature for GDC Simple Somatic Mutations
 */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    './BaseSeqFeature',
    '../../Model/SSMFeature'
],
function(
    declare,
    array,
    BaseSeqFeature,
    SSMFeature
) {
    return declare(BaseSeqFeature, {
        mutations: undefined,

        /**
         * Constructor
         * @param {*} args 
         */
        constructor: function (args) {
            // Filters to apply to SSM query
            this.filters = args.filters !== undefined ? JSON.parse(args.filters) : [];
            // Size of results
            this.size = args.size !== undefined ? parseInt(args.size) : 100;
            // Case ID
            this.case = args.case;
        },

        /**
         * Create an array of links for COSMIC
         * @param {List<object>} cosmic array of cosmic IDs
         */
        createCOSMICLinks: function(cosmic) {
            var thisB = this;

            var cosmicLinks = [];
            const COSMIC_LINK = 'https://cancer.sanger.ac.uk/cosmic/mutation/overview?id=';
            array.forEach(cosmic, function(cosmicId) {
                var cosmicIdNoPrefix = cosmicId.replace('COSM', '');
                cosmicIdNoPrefix = cosmicIdNoPrefix.replace('COSN', '');
                cosmicLinks.push(thisB.createLinkWithId(COSMIC_LINK, cosmicIdNoPrefix));
            });
            if (cosmicLinks.length > 0) {
                return cosmicLinks.join(", ");
            } else {
                return 'n/a';
            }
        },

        /**
         * Converts an int representation of strand to a string
         * @param {number} strand 
         * @return {string} + or -
         */
        convertIntToStrand: function(strand) {
            return strand == 1 ? '+' : '-'
        },

        /**
         * Pretty version of score
         * @param {string} label text to display
         * @param {string} score score value
         * @return {string} pretty score
         */
        prettyScore: function(label, score) {
            return label && score ? label + ' (' + score + ')' : 'n/a';
        },

        /**
         * Creates a table of consequences for a mutation
         * @param {List<object>} consequences list of consequence objects
         * @return {string} consequence table
         */
        createConsequencesTable: function(consequences) {
            var thisB = this;
            const TRANSCRIPT_LINK = 'http://may2015.archive.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=';
            const GENES_LINK = 'https://portal.gdc.cancer.gov/genes/';
            var headerRow = `
                <tr style=\"background-color: #f2f2f2\">
                    <th class="popup-table-header">Gene</th>
                    <th class="popup-table-header">AA Change</th>
                    <th class="popup-table-header">Consequence</th>
                    <th class="popup-table-header">Coding DNA Change</th> 
                    <th class="popup-table-header">Impact</th>
                    <th class="popup-table-header">Gene Strand</th>
                    <th class="popup-table-header">Transcript(s)</th>
                </tr>
            `;

            var consequenceTable = '<table class="popup-table" style="border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

            var count = 0;
            for (consequence of consequences) {
                var trStyle = '';
                if (count % 2 != 0) {
                    trStyle = 'style=\"background-color: #f2f2f2\"';
                }
                var consequenceRow = `<tr ${trStyle}>
                    <td class="popup-table-header">${thisB.createLinkWithIdAndName(GENES_LINK, consequence.node.transcript.gene.gene_id, consequence.node.transcript.gene.symbol)}</td>
                    <td class="popup-table-header">${thisB.prettyText(consequence.node.transcript.aa_change)}</td>
                    <td class="popup-table-header">${thisB.prettyText(consequence.node.transcript.consequence_type)}</td>
                    <td class="popup-table-header">${thisB.prettyText(consequence.node.transcript.annotation.hgvsc)}</td>
                    <td class="popup-table-header">
                        <ul style="list-style: none;">
                            <li>VEP: ${consequence.node.transcript.annotation.vep_impact}</li>
                            <li>SIFT: ${thisB.prettyScore(consequence.node.transcript.annotation.sift_impact, consequence.node.transcript.annotation.sift_score)}</li>
                            <li>Polyphen: ${thisB.prettyScore(consequence.node.transcript.annotation.polyphen_impact, consequence.node.transcript.annotation.polyphen_score)}</li>
                        </ul>
                    </td>
                    <td class="popup-table-header">${thisB.convertIntToStrand(consequence.node.transcript.gene.gene_strand)}</td>
                    <td class="popup-table-header">${thisB.createLinkWithId(TRANSCRIPT_LINK, consequence.node.transcript.transcript_id)}${consequence.node.transcript.is_canonical ? ' (C)' : ''}</td>
                    </tr>
                `;
                
                consequenceTable += consequenceRow;
                count++;
            }

            if (consequences.length == 0) {
                table += `
                    <tr class="dc-popup-table-header">
                        <td colspan="7" class="popup-table-header" style="text-align: center;">No consequences found</td>
                    </tr>
                `;
            }

            consequenceTable += '</table>';
            return consequenceTable;
        },

        /**
         * Creates a mutation feature with the given gene object
         * @param {object} mutation 
         * @param {function} featureCallback 
         */
        createMutationFeature: function(mutation, featureCallback) {
            var thisB = this;
            const GDC_LINK = 'https://portal.gdc.cancer.gov/ssms/';
            variantFeature = {
                id: mutation.ssm_id,
                data: {
                    'start': thisB.prettyText(mutation.start_position),
                    'end': thisB.prettyText(mutation.end_position),
                    'type': 'Simple Somatic Mutation',
                    'projects': mutation.ssm_id,
                    'about': {
                        'mutation type': thisB.prettyText(mutation.mutation_type),
                        'subtype': thisB.prettyText(mutation.mutation_subtype),
                        'dna change': thisB.prettyText(mutation.genomic_dna_change),
                        'reference allele': thisB.prettyText(mutation.reference_allele),
                        'id': thisB.prettyText(mutation.ssm_id)
                    },
                    'references': {
                        'gdc': thisB.createLinkWithId(GDC_LINK, mutation.ssm_id),
                        'cosmic': thisB.createCOSMICLinks(mutation.cosmic_id)
                    },
                    'mutation consequences': thisB.createConsequencesTable(mutation.consequence.hits.edges),
                }
            }
            featureCallback(new SSMFeature(variantFeature));
        },

        /**
         * Creates the query object for graphQL call
         * @param {string} ref chromosome
         * @param {number} start start position
         * @param {number} end end position
         */
        createQuery: function(ref, start, end) {
            var thisB = this;
            var ssmQuery = `query ssmResultsTableQuery( $ssmsTable_size: Int $ssmsTable_offset: Int $ssmsTable_filters: FiltersArgument $score: String $sort: [Sort] ) { viewer { explore { ssms { hits(first: $ssmsTable_size, offset: $ssmsTable_offset, filters: $ssmsTable_filters, score: $score, sort: $sort) { total edges { node { id start_position end_position mutation_type cosmic_id reference_allele ncbi_build score genomic_dna_change mutation_subtype ssm_id consequence { hits { edges { node { transcript { is_canonical annotation { vep_impact polyphen_impact polyphen_score sift_score sift_impact hgvsc } consequence_type gene { gene_id symbol gene_strand } aa_change transcript_id } id } } } } } } } } } } }`;
            var combinedFilters = thisB.getFilterQuery(ref, start, end);

            var bodyVal = {
                query: ssmQuery,
                variables: {
                    "ssmsTable_size": thisB.size,
                    "ssmsTable_offset": 0,
                    "ssmsTable_filters": combinedFilters,
                    "score":"occurrence.case.project.project_id",
                    "sort":[{"field":"_score","order":"desc"},{"field":"_uid","order":"asc"}]
                }
            }

            return bodyVal;
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

            // Create the body for the SSM request
            var bodyVal = JSON.stringify(thisB.createQuery(ref, start, end));
            thisB.mutations = [];

            // Fetch SSMs and create features
            fetch(thisB.graphQLUrl + '/SsmsTable', {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: bodyVal
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                if (response.data) {
                    thisB.mutations = response.data.viewer.explore.ssms.hits.edges;
                    for (var hitId in thisB.mutations) {
                        var mutation = thisB.mutations[hitId].node;
                        thisB.createMutationFeature(mutation, featureCallback);
                    }
                    finishCallback();
                } else {
                    console.log(err);
                    errorCallback('Error contacting GDC Portal');
                }
            }).catch(function(err) {
                console.log(err);
                errorCallback('Error contacting GDC Portal');
            });
        },

        /**
         * Creates the filter for the query to only look at SSMs in the given range
         * @param {string} chr chromsome
         * @param {number} start start position
         * @param {number} end end position
         */
        getLocationFilters: function(chr, start, end) {
            var thisB = this;
            var locationFilter = {"op":"and","content":[{"op":">=","content":{"field":"ssms.start_position","value":start}},{"op":"<=","content":{"field":"ssms.end_position","value":end}},{"op":"=","content":{"field":"ssms.chromosome","value":['chr'+chr]}}]};
            if (thisB.case) {
                var caseFilter = {"op":"in","content":{"field": "cases.case_id","value": thisB.case}};
                locationFilter.content.push(caseFilter);
            }
            return(locationFilter);
        }
    });
});