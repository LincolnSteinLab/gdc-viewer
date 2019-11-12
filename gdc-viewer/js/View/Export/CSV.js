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

    cnvHeader: [
        'start',
        'end',
        'score'
    ],

    fullHeader: [],

   _printHeader: function() {
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
            headerString = this.fullHeader.join(',') + '\n'
        }
        this.print(headerString)
   },

   formatFeature: function( feature ) {
        var featureArray = []

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