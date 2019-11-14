/**
 * Support for track config JSON export
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
    * Prints out the whole track config JSON file
    */
   _printHeader: function() {
       var storeArray = (this.store.config.type).split('/')

        var trackObject = {
            'label': this.track.labelHTML,
            'storeClass': this.store.config.type,
            'type': this.track.config.type,
            'key': this.track.key,
            'metadata': {
                'datatype': storeArray[storeArray.length - 1]
            },
            'case': this.store.case,
            'size': this.store.size
        }

        if (this.store.filters) {
            trackObject['filters'] = JSON.stringify(this.store.filters);
        }

        var trackString = JSON.stringify(trackObject, null, '\t');
   
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