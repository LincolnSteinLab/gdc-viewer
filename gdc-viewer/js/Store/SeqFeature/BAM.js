const LRU = cjsRequire('quick-lru')
const { BamFile } = cjsRequire('@gmod/bam')


const bamIndexedFilesCache = new LRU({ maxSize: 5 })

const BlobFilehandleWrapper = cjsRequire('JBrowse/Model/BlobFilehandleWrapper')


define( [
            'dojo/_base/declare',
            'JBrowse/Store/SeqFeature/BAM',
            'JBrowse/Store/SeqFeature/_PairCache',
            'JBrowse/Store/SeqFeature/_SpanCache',
            'JBrowse/Store/SeqFeature/_InsertSizeCache',
            'gdc-viewer/Model/XHRBlob'
        ],
        function(
            declare,
            BAM,
            PairCache,
            SpanCache,
            InsertSizeCache,
            XHRBlob
        ) {

return declare(BAM, {
    // Don't call BAM constructor, we replace it here
    '-chains-': {
      constructor: 'manual'
    },

    constructor( args ) {
        // Manually call BAM superclass constructors
        const bases = this.constructor._meta.parents._meta.bases;
        for (var idx = bases.length - 1; idx > 0; idx--) {
            bases[idx]._meta.ctor.apply(this, arguments);
        }

        let dataBlob
        if (args.bam)
            dataBlob = new BlobFilehandleWrapper(args.bam)
        else if (args.urlTemplate)
            dataBlob = new BlobFilehandleWrapper(new XHRBlob(this.resolveUrl(args.urlTemplate || 'data.bam'), { expectRanges: true }))
        else throw new Error('must provide either `bam` or `urlTemplate`')

        let baiBlob, csiBlob
        if (args.bai)
            baiBlob = new BlobFilehandleWrapper(args.bai)
        else if (args.csi)
            csiBlob = new BlobFilehandleWrapper(args.csi)
        else if (args.baiUrlTemplate)
            baiBlob = new BlobFilehandleWrapper(new XHRBlob(this.resolveUrl(args.baiUrlTemplate)))
        else if (args.csiUrlTemplate)
            csiBlob = new BlobFilehandleWrapper(new XHRBlob(this.resolveUrl(args.csiUrlTemplate)))
        else if (args.urlTemplate)
            baiBlob = new BlobFilehandleWrapper(new XHRBlob(this.resolveUrl(args.urlTemplate+'.bai')))
        else throw new Error('no index provided, must provide a BAI or CSI index')

        this.source = dataBlob.toString()

        // LRU-cache the BAM object so we don't have to re-download the
        // index when we switch chromosomes
        const cacheKey = `data: ${dataBlob}, index: ${csiBlob||baiBlob}`
        this.bam = bamIndexedFilesCache.get(cacheKey)
        if (!this.bam) {
            this.bam = new BamFile({
                bamFilehandle: dataBlob,
                baiFilehandle: baiBlob,
                csiFilehandle: csiBlob,
                renameRefSeqs: n => this.browser.regularizeReferenceName(n),
                fetchSizeLimit: args.fetchSizeLimit || 100000000,
                chunkSizeLimit: args.chunkSizeLimit || 20000000
            })

            bamIndexedFilesCache.set(cacheKey, this.bam)
        }

        // pre-download the index before running the statistics estimation so that the stats
        // estimation doesn't time out
        this.bam.hasRefSeq(0)
            .then(() => this.bam.getHeader())
            .then((header) => this._setSamHeader(header))
            .then((res) => {
                this._deferred.features.resolve({success:true});
            })
            .then(() => this._estimateGlobalStats())
            .then(stats => {
                this.globalStats = stats;
                this._deferred.stats.resolve({success:true});
            })
            .catch(err => {
                this._deferred.features.reject(err)
                this._deferred.stats.reject(err)
            })

        this.insertSizeCache = new InsertSizeCache(args);
        this.pairCache = new PairCache(args);
        this.spanCache = new SpanCache(args);
    }

});
});
