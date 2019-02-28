define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'JBrowse/Store/SeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    array,
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
            
            return resultingFilterQuery;
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
         * Creates a link to a given ID and name
         * @param {string} link Base URL for link
         * @param {string} id ID to apped to base URL
         */
        createLinkWithIdAndName: function(link, id, name) {
            return id !== null ? "<a href='" + link + id + "' target='_blank'>" + name + "</a>" : "n/a";
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

        convertIntToStrand: function(strand) {
            return strand == 1 ? '+' : '-'
        },

        prettyScore: function(label, score) {
            return label != null && score != null ? label + ' (' + score + ')' : 'n/a';
        },

        /**
         * Creates a table of consequences for a mutation
         * @param {List<Consequence>} consequences 
         */
        createConsequencesTable: function(consequences) {
            var thisB = this;
            const TRANSCRIPT_LINK = 'http://may2015.archive.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=';
            const GENES_LINK = 'https://portal.gdc.cancer.gov/genes/';
            var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
            var headerRow = `
                <tr style=\"background-color: #f2f2f2\">
                    <th style="${thStyle}">Gene</th>
                    <th style="${thStyle}">AA Change</th>
                    <th style="${thStyle}">Consequence</th>
                    <th style="${thStyle}">Coding DNA Change</th> 
                    <th style="${thStyle}">Impact</th>
                    <th style="${thStyle}">Gene Strand</th>
                    <th style="${thStyle}">Transcript(s)</th>
                </tr>
            `;

            var consequenceTable = '<table style="width: 560px; border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

            var count = 0;
            for (consequence of consequences) {
                var trStyle = '';
                if (count % 2 != 0) {
                    trStyle = 'style=\"background-color: #f2f2f2\"';
                }
                var consequenceRow = `<tr ${trStyle}>
                    <td style="${thStyle}">${thisB.createLinkWithIdAndName(GENES_LINK, consequence.node.transcript.gene.gene_id, consequence.node.transcript.gene.symbol)}</td>
                    <td style="${thStyle}">${thisB.prettyText(consequence.node.transcript.aa_change)}</td>
                    <td style="${thStyle}">${thisB.prettyText(consequence.node.transcript.consequence_type)}</td>
                    <td style="${thStyle}">${thisB.prettyText(consequence.node.transcript.annotation.hgvsc)}</td>
                    <td style="${thStyle}">
                        <ul style="list-style: none;">
                            <li>VEP: ${consequence.node.transcript.annotation.vep_impact}</li>
                            <li>SIFT: ${thisB.prettyScore(consequence.node.transcript.annotation.sift_impact, consequence.node.transcript.annotation.sift_score)}</li>
                            <li>Polyphen: ${thisB.prettyScore(consequence.node.transcript.annotation.polyphen_impact, consequence.node.transcript.annotation.polyphen_score)}</li>
                        </ul>
                    </td>
                    <td style="${thStyle}">${thisB.convertIntToStrand(consequence.node.transcript.gene.gene_strand)}</td>
                    <td style="${thStyle}">${thisB.createLinkWithId(TRANSCRIPT_LINK, consequence.node.transcript.transcript_id)}${consequence.node.transcript.is_canonical ? ' (C)' : ''}</td>
                    </tr>
                `;
                
                consequenceTable += consequenceRow;
                count++;
            }

            consequenceTable += '</table>';
            return consequenceTable;
        },

        /**
         * Prints text to avoid undefined/null
         * @param {*} text 
         */
        prettyText: function(text) {
            return text ? text : 'n/a';
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
         * Creates the query object for graphQL call
         * @param {*} ref 
         * @param {*} start 
         * @param {*} end 
         */
        createQuery: function(ref, start, end) {
            var thisB = this;
            var ssmQuery = `query ssmResultsTableQuery( $ssmsTable_size: Int $consequenceFilters: FiltersArgument $ssmsTable_offset: Int $ssmsTable_filters: FiltersArgument $score: String $sort: [Sort] ) { viewer { explore { ssms { hits(first: $ssmsTable_size, offset: $ssmsTable_offset, filters: $ssmsTable_filters, score: $score, sort: $sort) { total edges { node { id start_position end_position mutation_type cosmic_id reference_allele tumor_allele ncbi_build chromosome gene_aa_change score genomic_dna_change mutation_subtype ssm_id consequence { hits(first: 1, filters: $consequenceFilters) { edges { node { transcript { is_canonical annotation { vep_impact polyphen_impact polyphen_score sift_score sift_impact hgvsc } consequence_type gene { gene_id symbol } aa_change transcript_id } id } } } } } } } } } } }`;
            var combinedFilters = thisB.getFilterQuery(ref, start, end);

            var bodyVal = {
                query: ssmQuery,
                variables: {
                    "ssmsTable_size": thisB.size,
                    "consequenceFilters":{"op":"and","content":[{"op":"in","content":{"field":"consequence.transcript.is_canonical","value":["true"]}}]},
                    "ssmsTable_offset": 0,
                    "ssmsTable_filters": combinedFilters,
                    "score":"occurrence.case.project.project_id",
                    "sort":[{"field":"_score","order":"desc"},{"field":"_uid","order":"asc"}]
                }
            }

            return bodyVal;
        },

        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;

            // Setup query parameters
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');
            end = thisB.getChromosomeEnd(ref, end);

            console.log('get features from chr ' + ref + ': ' + start + ' - ' + end);

            var url = 'https://api.gdc.cancer.gov/v0/graphql/SsmsTable';
            const GDC_LINK = 'https://portal.gdc.cancer.gov/ssms/';

            var bodyVal = JSON.stringify(thisB.createQuery(ref, start, end));
            fetch(url, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: bodyVal
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                if (response.data) {
                    for (var hitId in response.data.viewer.explore.ssms.hits.edges) {
                        var variant = response.data.viewer.explore.ssms.hits.edges[hitId].node;
                        variantFeature = {
                            id: variant.ssm_id,
                            data: {
                                'start': variant.start_position,
                                'end': variant.end_position,
                                'GDC': thisB.createLinkWithId(GDC_LINK, variant.ssm_id),
                                'type': variant.mutation_type,
                                'Subtype': variant.mutation_subtype,
                                'Genomic DNA Change': variant.genomic_dna_change,
                                'COSMIC': thisB.createCOSMICLinks(variant.cosmic_id),
                                'Reference Allele': variant.reference_allele,
                                'Tumour Allele': variant.tumor_allele,
                                'NCBI Build': variant.ncbi_build,
                                'Chromosome': variant.chromosome,
                                'Gene AA Change': variant.gene_aa_change,
                                'Consequences': thisB.createConsequencesTable(variant.consequence.hits.edges)
                            }
                        }
                        featureCallback(new SimpleFeature(variantFeature));
                    }
                    finishCallback();
                }
            }).catch(function(err) {
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
            return({"op":"and","content":[{"op":">=","content":{"field":"ssms.start_position","value":start}},{"op":"<=","content":{"field":"ssms.end_position","value":end}},{"op":"=","content":{"field":"ssms.chromosome","value":['chr'+chr]}}]});
        }
    });
});