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
            var url = searchBaseUrl + 'genes'

            // Retrieve all mutations in the given chromosome range
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            }).then(function(results) {
                array.forEach(results.data.hits, function(gene) {
                    if (gene.gene_start >= start && gene.gene_end <= end && gene.gene_chromosome.replace(/chr/, '') === ref) {
                        console.log(gene);
                        geneFeature = {
                            id: gene.id,
                            data: {
                                start: gene.gene_start,
                                end: gene.gene_end,
                                strand: gene.gene_strand,
                                description: gene.description,
                                name: gene.name,
                                symbol: gene.symbol,
                                id: gene.gene_id,
                                biotype: gene.biotype,
                                synonyms: gene.synonyms,
                                canonical_transcript_id: gene.canonical_transcript_id,
                                canonical_transcript_length: gene.canonical_transcript_length,
                                cytoband: gene.cytoband,
                                canonical_transcript_length_genomic: gene.canonical_transcript_length_genomic,
                                canonical_transcript_length_cds: gene.canonical_transcript_length_cds,
                                is_cancer_gene_census: gene.is_cancer_gene_census
                            }
                        }
                        featureCallback(new SimpleFeature(geneFeature));
                    }
                });

                finishCallback();
            }, function(err) {
                console.log(err);
                errorCallback('Error contacting GDC Portal');
            });
        }
    });
});