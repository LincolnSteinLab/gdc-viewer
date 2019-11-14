/**
 * Support for SequinTable export
 */
define([ 'dojo/_base/declare',
         'dojo/_base/array',
         'JBrowse/View/Export/SequinTable'
       ],
       function( declare, array, SequinTable ) {

return declare( SequinTable,

{
    /**
    * Called on each feature to create a corresponding line in the sequin table file
    * @param {*} feature 
    */
    formatFeature: function( feature ) {
        var thisB = this;
        if( ! this.headerPrinted )
            this.headerPrinted = this._printHeader( feature );

        var featLine = [ feature.get('start')+1,
                         feature.get('end'),
                         feature.get('type') || 'region'
                       ];
        if( feature.get('strand') == -1 ) {
            var t = featLine[0];
            featLine[0] = featLine[1];
            featLine[1] = t;
        }

        var qualifiers = []
        var about = feature.get('about')
        for (var key of Object.keys(about)) {
            var qualifier = []
            qualifier.push(key)
            qualifier.push(about[key])
            qualifiers.push(qualifier)
        }

        return featLine.join("\t")+"\n" + array.map( qualifiers, function( q ) { return "\t\t\t"+q.join("\t")+"\n"; } ).join('') +
            array.map(feature.children(), f => this.formatFeature(f)).join('')
    }
});

});
