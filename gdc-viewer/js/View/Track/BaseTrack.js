/**
 * Base class for GDC tracks with clickable features
 */
define(
    [
        "dojo/_base/declare",
        "JBrowse/View/Track/HTMLFeatures",
        'JBrowse/View/Track/_ExportMixin',
        'JBrowse/Util',
        './CommonTrack'
    ],
   function(
       declare,
       HTMLFeatures,
       ExportMixin,
       Util,
       CommonTrack) {
   return declare([ HTMLFeatures, ExportMixin, CommonTrack ], {

        _defaultConfig: function() {
            return Util.deepUpdate(
                dojo.clone( this.inherited(arguments) ),
                {
                    unsafePopup: true
                }
            );
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
        }
   }); 
   }   
);