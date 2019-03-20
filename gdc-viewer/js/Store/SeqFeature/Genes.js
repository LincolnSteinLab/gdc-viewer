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
            this.size = args.size !== undefined ? parseInt(args.size) : 20;
            // Case ID
            this.case = args.case;
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
         * Gets the general project information for all projects available on the GDC
         */
        getProjectData: function() {
            var thisB = this;
            return new Promise(function(resolve, reject) {
                var bodyVal = {
                    query: `query projectData( $count: Int ) { projectsViewer: viewer { projects { hits(first: $count) { edges { node { primary_site disease_type project_id id } } } } } }`,
                    variables: {
                        "count": 100
                    }
                }
                fetch(thisB.graphQLUrl, {
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
         * Creates a gene feature with the given gene object
         * @param {*} gene 
         * @param {*} featureCallback 
         */
        createGeneFeature: function(gene, featureCallback) {
            var thisB = this;
            return new Promise(function(resolve, reject) {
                var geneId = gene.gene_id;
                var bodyVal = {
                    query: `query ProjectTable( $caseAggsFilters: FiltersArgument $ssmTested: FiltersArgument $cnvGain: FiltersArgument $cnvLoss: FiltersArgument $cnvTested: FiltersArgument $cnvTestedByGene: FiltersArgument $cnvAll: FiltersArgument $ssmFilters: FiltersArgument ) { viewer { explore { ssms { hits(first: 0, filters: $ssmFilters) { total } } cases { cnvAll: hits(filters: $cnvAll) { total } cnvTestedByGene: hits(filters: $cnvTestedByGene) { total } gain: aggregations(filters: $cnvGain) { project__project_id { buckets { doc_count key } } } loss: aggregations(filters: $cnvLoss) { project__project_id { buckets { doc_count key } } } cnvTotal: aggregations(filters: $cnvTested) { project__project_id { buckets { doc_count key } } } filtered: aggregations(filters: $caseAggsFilters) { project__project_id { buckets { doc_count key } } } total: aggregations(filters: $ssmTested) { project__project_id { buckets { doc_count key } } } } } } }`,
                    variables: {
                        "caseAggsFilters": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "ssm" ] } }, { "op": "NOT", "content": { "field": "cases.gene.ssm.observation.observation_id", "value": "MISSING" } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                        "ssmTested": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "ssm" ] } } ] },
                        "cnvGain": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } }, { "op": "in", "content": { "field": "cnvs.cnv_change", "value": [ "Gain" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                        "cnvLoss": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } }, { "op": "in", "content": { "field": "cnvs.cnv_change", "value": [ "Loss" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                        "cnvTested": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } } ] },
                        "cnvTestedByGene": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                        "cnvAll": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } }, { "op": "in", "content": { "field": "cnvs.cnv_change", "value": [ "Gain", "Loss" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                        "ssmFilters": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "ssm" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] }
                    }
                }
                fetch(thisB.graphQLUrl, {
                    method: 'post',
                    headers: { 'X-Requested-With': null },
                    body: JSON.stringify(bodyVal)
                }).then(function(response) {
                    return(response.json());
                }).then(function(response) {
                    const ENSEMBL_LINK = 'http://www.ensembl.org/id/';
                    const GDC_LINK = 'https://portal.gdc.cancer.gov/genes/';
                    const NCBI_LINK = 'http://www.ncbi.nlm.nih.gov/gene/';
                    const UNI_LINK = 'http://www.uniprot.org/uniprot/';
                    const HGNC_LINK = 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/';
                    const OMIM_LINK = 'https://www.omim.org/entry/';
                    geneFeature = {
                        id: gene.gene_id,
                        data: {
                            'start': gene.gene_start,
                            'end': gene.gene_end,
                            'strand': gene.gene_strand,
                            'about': {
                                'biotype': gene.biotype,
                                'gene name': gene.name,
                                'symbol': gene.symbol,
                                'synonyms': gene.synonyms,
                                'is cancer gene census': gene.is_cancer_gene_census
                            },
                            'gene description': gene.description,
                            'external references': {
                                'ncbi gene': thisB.createLinkWithId(NCBI_LINK, gene.external_db_ids.entrez_gene),
                                'uniprotkb swiss-prot': thisB.createLinkWithId(UNI_LINK, gene.external_db_ids.uniprotkb_swissprot),
                                'hgnc': thisB.createLinkWithId(HGNC_LINK, gene.external_db_ids.hgnc),
                                'omim': thisB.createLinkWithId(OMIM_LINK, gene.external_db_ids.omim_gene),
                                'ensembl': thisB.createLinkWithId(ENSEMBL_LINK, gene.gene_id),
                                'canonical transcript id': thisB.createLinkWithId(ENSEMBL_LINK, gene.canonical_transcript_id),
                                'gdc': thisB.createLinkWithId(GDC_LINK, gene.gene_id)
                            },
                            'projects': thisB.createProjectTable(response)
                        }
                    }
                    featureCallback(new SimpleFeature(geneFeature));
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
                    <th style="${thStyle}"># CNV Gains</th>
                    <th style="${thStyle}"># CNV Losses</th>
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
                    <td style="${thStyle}">${thisB.getValueWithPercentage(project.doc_count, thisB.findProjectByKey(response.data.viewer.explore.cases.total.project__project_id.buckets, project.key))}</td>
                    <td style="${thStyle}">${thisB.getValueWithPercentage(thisB.findProjectByKey(response.data.viewer.explore.cases.gain.project__project_id.buckets, project.key), thisB.findProjectByKey(response.data.viewer.explore.cases.cnvTotal.project__project_id.buckets, project.key))}</td>
                    <td style="${thStyle}">${thisB.getValueWithPercentage(thisB.findProjectByKey(response.data.viewer.explore.cases.loss.project__project_id.buckets, project.key), thisB.findProjectByKey(response.data.viewer.explore.cases.cnvTotal.project__project_id.buckets, project.key))}</td>
                    </tr>
                `;
                
                table += row;
                count++;
            }

            table += '</table>';
            return table;
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
            thisB.genes = [];

            thisB.getProjectData().then(function(response) {
                thisB.projects = response.data.projectsViewer.projects.hits.edges;
                return fetch(thisB.graphQLUrl + '/GenesTable', {
                    method: 'post',
                    headers: { 'X-Requested-With': null },
                    body: bodyVal
                });
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                if (response.data) {
                    var promiseArray = [];
                    thisB.genes = response.data.genesTableViewer.explore.genes.hits.edges;
                    for (var hitId in thisB.genes) {
                        var gene = thisB.genes[hitId].node;
                        promiseArray.push(thisB.createGeneFeature(gene, featureCallback));
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