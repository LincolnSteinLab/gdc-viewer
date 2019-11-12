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
       var storeArray = (this.store.config.type).split('/')

       var trackArray = [
            '[tracks.' + this.track.labelHTML + ']',
            'storeClass=' + this.store.config.type,
            'type=' + this.track.config.type,
            'key=' + this.track.key,
            'metadata.datatype=' + storeArray[storeArray.length - 1]
        ]

        if (this.store.case) {
            trackArray.push('case=' + this.store.case)
        }

        if (this.store.size) {
            trackArray.push('size=' + this.store.size)
        }

        if (this.store.filters) {
            trackArray.push('filters=' + JSON.stringify(this.store.filters))
        }

        var trackString = trackArray.join('\n')
   
        this.print(trackString)
   },

   formatFeature: function( feature ) {
       // This file type only requires track information and not feature information
        return ''
    }
});
});