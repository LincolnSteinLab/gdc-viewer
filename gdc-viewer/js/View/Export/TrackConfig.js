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

   _printHeader: function() {
       var featureArray = [
            '[tracks.' + this.store.config.label + ']',
            'storeClass=' + this.store.config.storeClass,
            'type=' + this.track.config.type,
            'key=' + this.store.config.key,
            'metadata.datatype=' + this.store.config.metadata.datatype,
            'unsafePopup=true',
        ]

        if (this.store.config.storeClass === 'gdc-viewer/Store/SeqFeature/SimpleSomaticMutations' || this.store.config.storeClass === 'gdc-viewer/Store/SeqFeature/Genes') {
            featureArray.push('fmtDetailValue_projects=function(value) { return "<div id=\'projects-gdc-" + value +  "\'>Loading...</div>";}');
        }

        if (this.store.config.storeClass === 'gdc-viewer/Store/SeqFeature/CNVs') {
            featureArray.push("autoscale=local");
            featureArray.push("bicolor_pivot=0");
        }

        if (this.store.filters) {
            featureArray.push('filters=' + JSON.stringify(this.store.filters))
        }

        var featureString = featureArray.join('\n')
   
        this.print(featureString)
   },

   formatFeature: function( feature ) {
       // This file type only requires track information and not feature information
        return ''
    }
});
});