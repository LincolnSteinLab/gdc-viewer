define(
    [
        "dojo/_base/declare",
        "JBrowse/View/Track/HTMLFeatures",
        'JBrowse/View/Track/_ExportMixin',
        'dojo/dom-construct',
        'dijit/form/Button'
    ],
   function(
       declare,
       HTMLFeatures,
       ExportMixin,
       domConstruct,
       Button) {
   return declare([ HTMLFeatures, ExportMixin ], {

    _canExportRegion: function( l ) {
        //console.log('can generic export?');
        console.log(l)
        if( ! l ) return false;

        console.log(this.config.maxExportSpan)

        // if we have a maxExportSpan configured for this track, use it.
        if( typeof this.config.maxExportSpan == 'number' || typeof this.config.maxExportSpan == 'string' ) {
            console.log(l.end - l.start + 1 + ' <= ' + this.config.maxExportSpan + '?')
            return l.end - l.start + 1 <= this.config.maxExportSpan;
        }
        else {
            // if we know the store's feature density, then use that with
            // a limit of maxExportFeatures or 5,000 features
            var thisB = this;
            var storeStats = {};
            // will return immediately if the stats are available
            this.store.getGlobalStats( function( s ) {
                storeStats = s;
            }, function(error){ }); // error callback does nothing for now
            console.log(storeStats)
            if( storeStats.featureDensity ) {
                console.log(storeStats.featureDensity*(l.end - l.start))
                console.log(thisB.config.maxExportFeatures)
                return storeStats.featureDensity*(l.end - l.start) <= ( thisB.config.maxExportFeatures || 50000 );
            }
        }

        // otherwise, i guess we can export
        return true;
    },

        _exportFormats: function() {
            return [
                {name: 'gdc-viewer/View/Export/GFF3', label: 'GFF3', fileExt: 'gff3'},
                {name: 'gdc-viewer/View/Export/BED', label: 'BED', fileExt: 'bed'},
                {name: 'gdc-viewer/View/Export/CSV', label: 'CSV', fileExt: 'csv'},
                {name: 'gdc-viewer/View/Export/SequinTable', label: 'Sequin Table', fileExt: 'sqn'},
                {name: 'gdc-viewer/View/Export/TrackConfig', label: 'Track Config', fileExt: 'conf'},
                {name: 'gdc-viewer/View/Export/TrackConfigJson', label: 'Track Config JSON', fileExt: 'json'}
            ];
        },

        _trackMenuOptions: function () {
            var options = this.inherited(arguments);
            options.push({
                label: 'Share Track as URL',
                action: "contentDialog",
                title: 'Share Track as URL',
                content: dojo.hitch(this,'_shareableLinkContent')
            });
            options.push({
                label: 'View Applied Filters',
                action: "contentDialog",
                title: 'View Applied Filters',
                content: dojo.hitch(this,'_appliedFilters')
            });
            return options;
        },

        _appliedFilters: function() {
            var track = this;
            var details = domConstruct.create('div', { className: 'detail', style: 'display: flex; flex-direction: column; align-items: center; justify-content: center;' });

            // Create help text
            var helpString = '<p>The following filters have been applied to the track.</p>';
            var helpElement = domConstruct.toDom(helpString);
            domConstruct.place(helpElement, details);

            // Get filtered text
            var filteredText = JSON.stringify(track.store.filters, null, 2)

            var textArea = domConstruct.create(
                'textarea',{
                    rows: 20,
                    value: filteredText,
                    style: "width: 80%",
                    readOnly: false,
                    id: "filterTextArea"
                }, details );

            var updateTrackButton = new Button({
                label: 'Update track',
                onClick: function() {
                    let trackString = document.getElementById("filterTextArea").value;
                    var storeConf = {
                        browser: track.browser,
                        refSeq: track.browser.refSeq,
                        type: track.store.config.type,
                        case: track.store.config.case,
                        filters: trackString
                    };
                    var storeName = track.browser.addStoreConfig(null, storeConf);
                    track.config.store = storeName;
                    track.browser.publish( '/jbrowse/v1/v/tracks/replace', [track.config] );
                }
            }).placeAt(details);
            return details;
        },

        _shareableLinkContent: function() {
            var track = this;
            var details = domConstruct.create('div', { className: 'detail', style: 'display: flex; flex-direction: column; align-items: center; justify-content: center;' });

            // Create addTracks value
            var addTracksArray = [];
            var addTrackConf = {};
            addTrackConf.label = track.config.label;
            addTrackConf.storeClass = track.store.config.type;
            addTrackConf.type = track.config.type;
            addTrackConf.key = track.config.key;
            addTrackConf.metadata = track.config.metadata;
            addTrackConf.unsafePopup = true;
            addTrackConf.filters = track.store.config.filters;
            addTrackConf.case = track.store.config.case;
            addTrackConf.size = track.config.size;
            addTracksArray.push(addTrackConf);
            addTracksArray = JSON.stringify(addTracksArray); 

            // Create a shareable URL
            var params = new URLSearchParams(window.location.search);
            params.set("addTracks", addTracksArray);
            var shareableLink = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();

            // Create help text
            var helpString = '<p>Use the following link to share the selected track at the current location.</p>';
            var helpElement = domConstruct.toDom(helpString);
            domConstruct.place(helpElement, details);

            // Create text area with shareable link
            var textArea = domConstruct.create(
                'textarea',{
                    rows: 10,
                    value: shareableLink,
                    style: "width: 80%",
                    readOnly: true
                }, details );

            // Create a DOM element for the link
            var linkString = '<a target="_blank" href="' + shareableLink + '">Open in New Tab</a>';
            var linkElement = domConstruct.toDom(linkString);
            domConstruct.place(linkElement, details);

            return details;
        }
   }); 
   }   
);