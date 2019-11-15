/**
 * Class for CNV tracks
 */
define(
    [
        "dojo/_base/declare",
        "JBrowse/View/Track/Wiggle/XYPlot",
        'JBrowse/View/Track/_ExportMixin',
        'JBrowse/Util',
        './CommonTrack'
    ],
   function(
       declare,
       XYPlot,
       ExportMixin,
       Util,
       CommonTrack) {
   return declare([ XYPlot, ExportMixin, CommonTrack ], {

        _defaultConfig: function() {
            return Util.deepUpdate(
                dojo.clone( this.inherited(arguments) ),
                {
                    maxExportSpan: null,
                    autoscale: 'local',
                    bicolor_pivot: 0
                }
            );
        },

        _exportFormats: function() {
            return [
                {name: 'GFF3', label: 'GFF3', fileExt: 'gff3'},
                {name: 'bedGraph', label: 'bedGraph', fileExt: 'bedgraph'},
                {name: 'gdc-viewer/View/Export/CSV', label: 'CSV', fileExt: 'csv'},
                {name: 'Wiggle', label: 'Wiggle', fileExt: 'wig'},
                {name: 'gdc-viewer/View/Export/TrackConfig', label: 'Track Config', fileExt: 'conf'},
                {name: 'gdc-viewer/View/Export/TrackConfigJson', label: 'Track Config JSON', fileExt: 'json'}
            ];
        }
   }); 
   }   
);