/**
 * Support for CSV export
 */
define([ 'dojo/_base/declare',
         'JBrowse/View/Export'
       ],
       function( declare, ExportBase ) {

return declare( ExportBase,

{
   constructor: function( args ) {
       this._printHeader(args);
   },

   // The base header for genes and ssms
   defaultHeader: [
        'type',
        'start',
        'end',
        'strand',
        'id'
   ],

   // The extended header for genes
   geneHeader: [
        'gene name',
        'biotype',
        'symbol',
        'synonyms'
   ],

   // The extended header for ssms
   ssmHeader: [
        'reference allele',
        'dna change',
        'subtype'
    ],

    // The full header for cnvs
    cnvHeader: [
        'start',
        'end',
        'score'
    ],

    fullHeader: [],

    /**
     * Print out the header of the CSV file
     */
   _printHeader: function() {
        this.fullHeader = []
        if (this.store.config.storeClass === 'gdc-viewer/Store/SeqFeature/Genes') {
            this.fullHeader = this.geneHeader
        } else if (this.store.config.storeClass === 'gdc-viewer/Store/SeqFeature/SimpleSomaticMutations') {
            this.fullHeader = this.ssmHeader
        } else if (this.store.config.storeClass === 'gdc-viewer/Store/SeqFeature/CNVs') {
            this.fullHeader = this.cnvHeader
        }

        var headerString
        if (this.store.config.storeClass !== 'gdc-viewer/Store/SeqFeature/CNVs') {
            headerString = (this.defaultHeader.concat(this.fullHeader)).join(',') + '\n'
        } else {
            headerString = this.cnvHeader.join(',') + '\n'
        }
        this.print(headerString)
   },

   /**
    * Called on each feature to create a corresponding line in the CSV file
    * @param {*} feature 
    */
   formatFeature: function( feature ) {
        var featureArray = []

        // SSM and Gene features have the extra about section
        if (this.store.config.storeClass !== 'gdc-viewer/Store/SeqFeature/CNVs') {
            this.defaultHeader.forEach(field => featureArray.push(feature.get(field)))
            var about = feature.get('about')
            this.fullHeader.forEach(field => {
                if (field === 'synonyms') {
                    if (about[field]) {
                        featureArray.push('[' + about[field] + ']')
                    }
                } else {
                    featureArray.push(about[field])
                }
            })
        } else {
            this.cnvHeader.forEach(field => featureArray.push(feature.get(field)))
        }
        return featureArray.join(",") + "\n"
    }
});
});