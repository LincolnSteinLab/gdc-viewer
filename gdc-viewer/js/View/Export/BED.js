define([ 'dojo/_base/declare',
         'dojo/_base/array',
         'JBrowse/View/Export/BED'
       ],
       function( declare, array, BED ) {

return declare( BED,

{

    bed_field_names: [
        'seq_id',
        'start',
        'end',
        'entity_name',
        'score',
        'strand',
        'thickStart',
        'thickEnd',
        'itemRgb',
        'blockCount',
        'blockSizes',
        'blockStarts'
    ],

    /**
     * Format a feature into a string.
     * @param {Object} feature feature object (like those returned from JBrowse/Store/SeqFeature/*)
     * @returns {String} BED string representation of the feature
     */
    formatFeature: function( feature ) {
        var fields = array.map(
                [ feature.get('seq_id') || this.refSeq.name ]
                .concat( dojo.map( this.bed_field_names.slice(1,11), function(field) {
                                       return feature.get( field );
                                   },this)
                       ),
            function( data ) {
                var t = typeof data;
                if( t == 'string' || t == 'number' )
                    return data;
                return '';
            },
            this
        );

        // normalize the strand field
        fields[5] = { '1': '+', '-1': '-', '0': '+' }[ fields[5] ] || fields[5];
        return fields.join("\t")+"\n";
    }
});

});
