/**
 * Support for track config table export
 */

define([ 'dojo/_base/declare',
         'JBrowse/View/Export'
       ],
       function( declare, ExportBase ) {

return declare( ExportBase,

{
    /**
     * Constructor
     * @param {*} args 
     */
   constructor: function( args ) {
       this._printHeader(args);
   },

   /**
    * Prints out the whole track config file
    */
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

   /**
    * No features to print out since this is a track level file
    * @param {*} feature 
    */
   formatFeature: function( feature ) {
        return ''
    }
});
});