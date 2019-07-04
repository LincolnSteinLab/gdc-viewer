/**
 * Support for Sequin Feature table export.  See
 * http://www.ncbi.nlm.nih.gov/Sequin/table.html.
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

   defaultHeader: [
        'type',
        'start',
        'end',
        'strand',
        'id'
   ],

   geneHeader: [
        'gene name',
        'biotype',
        'symbol',
        'synonyms'
   ],

   ssmHeader: [
        'reference allele',
        'dna change',
        'subtype'
    ],

    fullHeader: [],

   _printHeader: function() {
        if (this.store.config.storeClass === 'gdc-viewer/Store/SeqFeature/Genes') {
            this.fullHeader = this.geneHeader
        } else if (this.store.config.storeClass === 'gdc-viewer/Store/SeqFeature/SimpleSomaticMutations') {
            this.fullHeader = this.ssmHeader
        }

        var headerString = (this.defaultHeader.concat(this.fullHeader)).join(',') + '\n'
        this.print(headerString)
   },

   formatFeature: function( feature ) {
       var featureArray = []
       this.defaultHeader.forEach(field => featureArray.push(feature.get(field)))
       var about = feature.get('about')
       this.fullHeader.forEach(field => {
           if (field === 'synonyms') {
            featureArray.push
            if (about[field]) {
                featureArray.push('[' + about[field] + ']')
            }
           } else {
            featureArray.push(about[field])
           }
       })
       return featureArray.join(",") + "\n"
    }
});
});