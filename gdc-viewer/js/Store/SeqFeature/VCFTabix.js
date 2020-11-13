const { TabixIndexedFile } = cjsRequire('@gmod/tabix')

define( [
            'dojo/_base/declare',
            'dojo/_base/lang',
            'JBrowse/Store/SeqFeature/VCFTabix',
            'gdc-viewer/Model/XHRBlob',
            'JBrowse/Model/BlobFilehandleWrapper',
            'gdc-viewer/Util/SkipLastCtor'
        ],
        function(
            declare,
            lang,
            VCFTabix,
            XHRBlob,
            BlobFilehandleWrapper,
            SkipLastCtor
        ) {

return declare(SkipLastCtor(VCFTabix), {

    constructor( args ) {
        this.inherited(arguments);

        var thisB = this;
        var csiBlob, tbiBlob;

        if(args.csi || this.config.csiUrlTemplate) {
            csiBlob = new BlobFilehandleWrapper(args.csi ||
                    new XHRBlob(
                        this.resolveUrl(
                            this.getConf('csiUrlTemplate',[])
                        )
                    )
                );
        } else {
            tbiBlob = new BlobFilehandleWrapper(args.tbi ||
                    new XHRBlob(
                        this.resolveUrl(
                            this.getConf('tbiUrlTemplate',[]) || this.getConf('urlTemplate',[])+'.tbi'
                        )
                    )
                );
        }

        var fileBlob = new BlobFilehandleWrapper(args.file ||
                new XHRBlob(
                    this.resolveUrl( this.getConf('urlTemplate',[]) ),
                    { expectRanges: true }
                )
            );

        this.fileBlob = fileBlob

        this.indexedData = new TabixIndexedFile({
            tbiFilehandle: tbiBlob,
            csiFilehandle: csiBlob,
            filehandle: fileBlob,
            chunkSizeLimit: args.chunkSizeLimit || 1000000,
            renameRefSeqs: n => this.browser.regularizeReferenceName(n)
        });

        this.getParser()
            .then( function( parser ) {
                       thisB._deferred.features.resolve({success:true});
                       thisB._estimateGlobalStats()
                            .then(
                                function( stats ) {
                                    thisB.globalStats = stats;
                                    thisB._deferred.stats.resolve( stats );
                                },
                                lang.hitch( thisB, '_failAllDeferred' )
                            );
                   },
                   lang.hitch( thisB, '_failAllDeferred' )
                 );

    }

});
});
