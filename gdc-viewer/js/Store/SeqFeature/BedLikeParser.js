define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'JBrowse/Store/SeqFeature/BED/Parser',
],
function (
    declare,
    array,
    Parser
) {
    var bed_feature_names = 'seq_id start end name score strand'.split(" ");
    var extra_feature_names = []

    return declare(Parser, {
        setExtraFields: function(extraFields) {
            extra_feature_names = extraFields.trim().split('\t')
        },

        parse_feature: function( line ) {
            var f = array.map( line.split("\t"), function(a) {
                if( a == '.' ) {
                    return null;
                }
                return a;
            });
    
            // unescape only the ref and source columns
            f[0] = this.unescape( f[0] );
    
            var parsed = {};
            const combinedFeatures = bed_feature_names.concat(extra_feature_names)
            for( var i = 0; i < combinedFeatures.length; i++ ) {
                if(f[i]) {
                    parsed[ combinedFeatures[i].toLowerCase() ] = f[i] == '.' ? null : f[i];
                }
            }

            if( parsed.start !== null )
                parsed.start = parseInt( parsed.start, 10 );
            if( parsed.end !== null )
                parsed.end = parseInt( parsed.end, 10 );
            if( parsed.score != null )
                parsed.score = parseFloat( parsed.score, 10 );
    
            parsed.strand = {'+':1,'-':-1}[parsed.strand] || 0;
    
            return parsed;
        },

        unescape(s) {
            if( s === null )
                return null;
    
            return s.replace( /%([0-9A-Fa-f]{2})/g, function( match, seq ) {
                                    return String.fromCharCode( parseInt( seq, 16 ) );
                                });
        },
    });
});
