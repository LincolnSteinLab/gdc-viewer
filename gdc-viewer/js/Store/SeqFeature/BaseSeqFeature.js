define([
    'dojo/_base/declare',
    'JBrowse/Store/SeqFeature'
],
function(
    declare,
    SeqFeatureStore
) {
    return declare(SeqFeatureStore, {
        graphQLUrl: 'https://api.gdc.cancer.gov/v0/graphql',

        /**
         * Creates a combined filter query based on the location and any filters passed
         * @param {string} chr chromosome to filter by
         * @param {number} start start position
         * @param {number} end end position
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
            return id ? "<a href='" + link + id + "' target='_blank'>" + id + "</a>" : "n/a";
        },

        /**
         * Creates a link to a given ID and name
         * @param {string} link base URL for link
         * @param {string} id ID to apped to base URL
         * @param {string} name text to display
         * @return {string} a tag
         */
        createLinkWithIdAndName: function(link, id, name) {
            return id ? "<a href='" + link + id + "' target='_blank'>" + name + "</a>" : "n/a";
        },

        /**
         * Prints text to avoid undefined/null
         * @param {string} text text to display
         * @return {string} pretty text
         */
        prettyText: function(text) {
            return text && text !== null && text !== undefined ? text : 'n/a';
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
         * Stub for getParser
         */
        getParser: function() {
            return new Promise(function(resolve, reject) {
                resolve({'getMetadata': function() {}});
            });
        },
    });
});