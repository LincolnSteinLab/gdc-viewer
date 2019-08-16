import gff from '@gmod/gff'

define([ 'dojo/_base/declare',
         'JBrowse/View/Export/GFF3'
       ],
       function( declare, GFF3 ) {

return declare( GFF3,
{

    /**
     * Need to overwrite this function to deal with object attributes
     * @private
     * @returns {String} formatted attribute string
     */
    _gff3_format_attributes: function( attrs ) {
        var attrOrder = [];
        for( var tag in attrs ) {
            var val = attrs[tag];
            if(!val || tag != 'about') {
                continue;
            }

            var valstring = gff.util.escape(JSON.stringify(val))
            attrOrder.push( gff.util.escape( tag )+'='+valstring);
        }
        return attrOrder.join(';') || '.';
    },
});
});
