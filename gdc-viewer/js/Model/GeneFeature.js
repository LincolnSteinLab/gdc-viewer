/**
 * Simple implementation of a Gene feature object.
 */
define([
    'JBrowse/Model/SimpleFeature',
    'dojo/_base/declare'
   ],
   function( SimpleFeature, declare ) {

return declare(SimpleFeature, {

projects: undefined,

/**
 * Get a piece of data about the feature.  All features must have
 * 'start' and 'end', but everything else is optional.
 */
get: function(name) {
    var thisB = this;
    if (name == 'projects') {
        var geneId = this.data[name.toLowerCase()];

        var bodyValProjectsTable = {
            query: `query ProjectTable( $caseAggsFilters: FiltersArgument $ssmTested: FiltersArgument $cnvGain: FiltersArgument $cnvLoss: FiltersArgument $cnvTested: FiltersArgument $cnvTestedByGene: FiltersArgument $cnvAll: FiltersArgument $ssmFilters: FiltersArgument $projectCount: Int ) { viewer { explore { ssms { hits(first: 0, filters: $ssmFilters) { total } } cases { cnvAll: hits(filters: $cnvAll) { total } cnvTestedByGene: hits(filters: $cnvTestedByGene) { total } gain: aggregations(filters: $cnvGain) { project__project_id { buckets { doc_count key } } } loss: aggregations(filters: $cnvLoss) { project__project_id { buckets { doc_count key } } } cnvTotal: aggregations(filters: $cnvTested) { project__project_id { buckets { doc_count key } } } filtered: aggregations(filters: $caseAggsFilters) { project__project_id { buckets { doc_count key } } } total: aggregations(filters: $ssmTested) { project__project_id { buckets { doc_count key } } } } } } projects { hits(first: $projectCount) { edges { node { primary_site disease_type project_id id } } } } }`,
            variables: {
                "caseAggsFilters": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "ssm" ] } }, { "op": "NOT", "content": { "field": "cases.gene.ssm.observation.observation_id", "value": "MISSING" } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                "ssmTested": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "ssm" ] } } ] },
                "cnvGain": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } }, { "op": "in", "content": { "field": "cnvs.cnv_change", "value": [ "Gain" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                "cnvLoss": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } }, { "op": "in", "content": { "field": "cnvs.cnv_change", "value": [ "Loss" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                "cnvTested": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } } ] },
                "cnvTestedByGene": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                "cnvAll": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "cnv" ] } }, { "op": "in", "content": { "field": "cnvs.cnv_change", "value": [ "Gain", "Loss" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                "ssmFilters": { "op": "and", "content": [ { "op": "in", "content": { "field": "cases.available_variation_data", "value": [ "ssm" ] } }, { "op": "in", "content": { "field": "genes.gene_id", "value": [ geneId ] } } ] },
                "projectCount": 100
            }
        }
        fetch('https://api.gdc.cancer.gov/v0/graphql/projectsTable', {
            method: 'post',
            headers: { 'X-Requested-With': null },
            body: JSON.stringify(bodyValProjectsTable)
        }).then(function(response) {
            return(response.json());
        }).then(function(response) {
            thisB.projects = response.data.projects.hits.edges;
            document.getElementsByClassName('value projects')[0].innerHTML = thisB.createProjectTable(response);
        }).catch(function(err) {
            document.getElementsByClassName('value projects')[0].innerHTML = 'Error creating projects table';
        });
        return geneId;
    } else {
        return this.data[ name.toLowerCase() ];
    }
},

/**
 * Creates a project table that shows the distribution of a gene across projects
 * @param {object} response 
 */
createProjectTable: function(response) {
    var thisB = this;
    var headerRow = `
        <tr style=\"background-color: #f2f2f2\">
            <th class="popup-table-header">Project</th>
            <th class="popup-table-header">Disease Type</th>
            <th class="popup-table-header">Site</th>
            <th class="popup-table-header"># Mutation Affected Cases</th> 
            <th class="popup-table-header"># CNV Gains</th>
            <th class="popup-table-header"># CNV Losses</th>
        </tr>
    `;

    var table = '<table class="popup-table" style="border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

    var count = 0;
    var projects = response.data.viewer.explore.cases.filtered.project__project_id.buckets;
    for (project of projects) {
        var trStyle = '';
        if (count % 2 != 0) {
            trStyle = 'style=\"background-color: #f2f2f2\"';
        }
        var projectInfo = thisB.projects.find(x => x.node.project_id === project.key);
        var row = `<tr ${trStyle}>
            <td class="popup-table-td"><a target="_blank"  href="https://portal.gdc.cancer.gov/projects/${project.key}">${project.key}</a></td>
            <td class="popup-table-td">${thisB.printList(projectInfo.node.disease_type)}</td>
            <td class="popup-table-td">${thisB.printList(projectInfo.node.primary_site)}</td>
            <td class="popup-table-td">${thisB.getValueWithPercentage(project.doc_count, thisB.findProjectByKey(response.data.viewer.explore.cases.total.project__project_id.buckets, project.key))}</td>
            <td class="popup-table-td">${thisB.getValueWithPercentage(thisB.findProjectByKey(response.data.viewer.explore.cases.gain.project__project_id.buckets, project.key), thisB.findProjectByKey(response.data.viewer.explore.cases.cnvTotal.project__project_id.buckets, project.key))}</td>
            <td class="popup-table-td">${thisB.getValueWithPercentage(thisB.findProjectByKey(response.data.viewer.explore.cases.loss.project__project_id.buckets, project.key), thisB.findProjectByKey(response.data.viewer.explore.cases.cnvTotal.project__project_id.buckets, project.key))}</td>
            </tr>
        `;
        
        table += row;
        count++;
    }

    if (projects.length == 0) {
        table += `
            <tr class="dc-popup-table-header">
                <td colspan="6" class="popup-table-td" style="text-align: center;">No projects found</td>
            </tr>
        `;
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
 * Given a numerator and denominator, creates a pretty score with percentage
 * @param {number} numerator
 * @param {number} denominator
 */
getValueWithPercentage: function(numerator, denominator) {
    return numerator + '/' + denominator + ' (' + (numerator / denominator * 100).toFixed(2) + '%)';
},

/**
 * Finds the corresponding project doc_count in a list of projects
 * @param {List<object>} projects  list of project objects
 * @param {string} key object key to look for
 */
findProjectByKey: function(projects, key) {
    var project = projects.find(project => project.key === key);
    return project ? project.doc_count : 0;
}

});

});