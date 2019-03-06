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
        projects: undefined,
        mutations: undefined,

        /**
         * Constructor
         * @param {*} args 
         */
        constructor: function (args) {
            // Filters to apply to SSM query
            this.filters = args.filters !== undefined ? JSON.parse(args.filters) : [];
            // Size of results
            this.size = args.size !== undefined ? parseInt(args.size) : 20;
            // Case ID
            this.case = args.case;
        },

        /**
         * Creates a combined filter query based on the location and any filters passed
         * @param {*} chr chromsome
         * @param {*} start start position
         * @param {*} end end position
         * @return {object} query object
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
         * @param {string} link base URL for link
         * @param {string} id ID to apped to base URL
         * @return {string} a tag
         */
        createLinkWithId: function(link, id) {
            return id !== null ? "<a href='" + link + id + "' target='_blank'>" + id + "</a>" : "n/a";
        },

        /**
         * Creates a link to a given ID and name
         * @param {string} link base URL for link
         * @param {string} id ID to apped to base URL
         * @param {string} name text to display
         * @return {string} a tag
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
         * @param {*} label text to display
         * @param {*} score score value
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
         * @param {string} text text to display
         * @return {string} pretty text
         */
        prettyText: function(text) {
            return text ? text : 'n/a';
        },
 
        /**
         * Returns the end value to be used for querying GDC
         * @param {string} chr Chromosome number (ex. 1)
         * @param {number} end End location of JBrowse view
         * @return {number} chromsome end position
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
         * Gets the general project information for all projects available on the GDC
         */
        getProjectData: function() {
            var thisB = this;
            return new Promise(function(resolve, reject) {
                var url = 'https://api.gdc.cancer.gov/v0/graphql';
                var bodyVal = {
                    query: `query projectData( $count: Int ) { projectsViewer: viewer { projects { hits(first: $count) { edges { node { primary_site disease_type project_id id } } } } } }`,
                    variables: {
                        "count": 100
                    }
                }
                fetch(url, {
                    method: 'post',
                    headers: { 'X-Requested-With': null },
                    body: JSON.stringify(bodyVal)
                }).then(function(response) {
                    return(response.json());
                }).then(function(response) {
                    resolve(response);
                }).catch(function(error) {
                    reject(error);
                });
            });
        },



        /**
         * Creates a mutation feature with the given gene object
         * @param {*} mutation 
         * @param {*} featureCallback 
         */
        createMutationFeature: function(mutation, featureCallback) {
            var thisB = this;
            return new Promise(function(resolve, reject) {
                var mutationId = mutation.ssm_id;
                var url = 'https://api.gdc.cancer.gov/v0/graphql';
                var bodyVal = {
                    query: `query projectsTable($ssmTested: FiltersArgument, $caseAggsFilter: FiltersArgument) { viewer { explore { cases { filtered: aggregations(filters: $caseAggsFilter) { project__project_id { buckets { doc_count key } } } total: aggregations(filters: $ssmTested) { project__project_id { buckets { doc_count key } } } } } } }`,
                    variables: {
                        "ssmTested": { "op":"and", "content":[ { "op":"in", "content":{ "field":"cases.available_variation_data", "value":[ "ssm" ] } } ] } ,
                        "caseAggsFilter": { "op":"and", "content":[ { "op":"in", "content":{ "field":"ssms.ssm_id", "value":[ mutationId ] } }, { "op":"in", "content":{ "field":"cases.available_variation_data", "value":[ "ssm" ] } } ] }
                    }
                }
                fetch(url, {
                    method: 'post',
                    headers: { 'X-Requested-With': null },
                    body: JSON.stringify(bodyVal)
                }).then(function(response) {
                    return(response.json());
                }).then(function(response) {
                    const GDC_LINK = 'https://portal.gdc.cancer.gov/ssms/';
                    variantFeature = {
                        id: mutation.ssm_id,
                        data: {
                            'start': mutation.start_position,
                            'end': mutation.end_position,
                            'about': {
                                'mutation type': mutation.mutation_type,
                                'subtype': mutation.mutation_subtype,
                                'dna change': mutation.genomic_dna_change,
                                'reference allele': mutation.reference_allele,
                            },
                            'external references': {
                                'gdc': thisB.createLinkWithId(GDC_LINK, mutation.ssm_id),
                                'cosmic': thisB.createCOSMICLinks(mutation.cosmic_id)
                            },
                            'mutation consequences': thisB.createConsequencesTable(mutation.consequence.hits.edges),
                            'projects': thisB.createProjectTable(response)
                        }
                    }
                    featureCallback(new SimpleFeature(variantFeature));
                    resolve();
                }).catch(function(error) {
                    reject(error);
                });
            });
        },

        /**
         * Finds the corresponding project doc_count in a list of projects
         */
        findProjectByKey: function(projects, key) {
            var project = projects.find(project => project.key === key);
            return project ? project.doc_count : 0;
        },

        /**
         * Creates a project table that shows the distribution of a gene across projects
         * @param {*} response 
         */
        createProjectTable: function(response) {
            var thisB = this;
            var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
            var headerRow = `
                <tr style=\"background-color: #f2f2f2\">
                    <th style="${thStyle}">Project</th>
                    <th style="${thStyle}">Disease Type</th>
                    <th style="${thStyle}">Site</th>
                    <th style="${thStyle}"># SSM Affected Cases</th> 
                </tr>
            `;

            var table = '<table style="width: 560px; border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

            var count = 0;
            for (project of response.data.viewer.explore.cases.filtered.project__project_id.buckets) {
                var trStyle = '';
                if (count % 2 != 0) {
                    trStyle = 'style=\"background-color: #f2f2f2\"';
                }
                var projectInfo = thisB.projects.find(x => x.node.project_id === project.key);
                var row = `<tr ${trStyle}>
                    <td style="${thStyle}"><a target="_blank"  href="https://portal.gdc.cancer.gov/projects/${project.key}">${project.key}</a></td>
                    <td style="${thStyle}">${thisB.printList(projectInfo.node.disease_type)}</td>
                    <td style="${thStyle}">${thisB.printList(projectInfo.node.primary_site)}</td>
                    <td style="${thStyle}">${project.doc_count} / ${thisB.findProjectByKey(response.data.viewer.explore.cases.total.project__project_id.buckets, project.key)}</td>
                    </tr>
                `;
                
                table += row;
                count++;
            }

            table += '</table>';
            return table;
        },

        /**
         * Convert a list of strings to a HTML list
         * @param {List<string>} list 
         */
        printList: function(list) {
            var listTag = '<ul>';
            for (item of list) {
                listTag += '<li>' + item + '</li>';
            }
            listTag += '</ul>';
            return listTag;
        },

        /**
         * Creates the query object for graphQL call
         * @param {*} ref chromosome
         * @param {*} start start position
         * @param {*} end end position
         */
        createQuery: function(ref, start, end) {
            var thisB = this;
            var ssmQuery = `query ssmResultsTableQuery( $ssmsTable_size: Int $consequenceFilters: FiltersArgument $ssmsTable_offset: Int $ssmsTable_filters: FiltersArgument $score: String $sort: [Sort] ) { viewer { explore { ssms { hits(first: $ssmsTable_size, offset: $ssmsTable_offset, filters: $ssmsTable_filters, score: $score, sort: $sort) { total edges { node { id start_position end_position mutation_type cosmic_id reference_allele ncbi_build score genomic_dna_change mutation_subtype ssm_id consequence { hits(first: 1, filters: $consequenceFilters) { edges { node { transcript { is_canonical annotation { vep_impact polyphen_impact polyphen_score sift_score sift_impact hgvsc } consequence_type gene { gene_id symbol } aa_change transcript_id } id } } } } } } } } } } }`;
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

            var url = 'https://api.gdc.cancer.gov/v0/graphql/SsmsTable';

            var bodyVal = JSON.stringify(thisB.createQuery(ref, start, end));
            thisB.mutations = [];

            thisB.getProjectData().then(function(response) {
                thisB.projects = response.data.projectsViewer.projects.hits.edges;
                return fetch(url, {
                    method: 'post',
                    headers: { 'X-Requested-With': null },
                    body: bodyVal
                });
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                if (response.data) {
                    var promiseArray = [];
                    thisB.mutations = response.data.viewer.explore.ssms.hits.edges;
                    for (var hitId in thisB.mutations) {
                        var mutation = thisB.mutations[hitId].node;
                        promiseArray.push(thisB.createMutationFeature(mutation, featureCallback));
                    }
                    Promise.all(promiseArray).then(function(result) {
                        finishCallback();
                    });
                }
            }).catch(function(err) {
                console.log(err);
                errorCallback('Error contacting GDC Portal');
            });
        },

        /**
         * Stub for getParser
         */
        getParser: function() {
            return new Promise(function(resolve, reject) {
                resolve({'getMetadata': function() {}});
            });
        },

        /**
         * Creates the filter for the query to only look at SSMs in the given range
         * @param {*} chr chromsome
         * @param {*} start start position
         * @param {*} end end position
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