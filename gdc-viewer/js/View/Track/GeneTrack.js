define(
    [
        "dojo/_base/declare",
        "JBrowse/View/Track/CanvasFeatures",
        'JBrowse/View/Track/_ExportMixin',
        'dojo/dom-construct'
    ],
   function(
       declare,
       CanvasFeatures,
       ExportMixin,
       domConstruct) {
   return declare([ CanvasFeatures, ExportMixin ], {

        _exportFormats: function() {
            return [
                {name: 'gdc-viewer/View/Export/GFF3', label: 'GFF3', fileExt: 'gff3'},
                {name: 'gdc-viewer/View/Export/BED', label: 'BED', fileExt: 'bed'},
                {name: 'gdc-viewer/View/Export/CSV', label: 'CSV', fileExt: 'csv'},
                {name: 'icgc-viewer/View/Export/SequinTable', label: 'Sequin Table', fileExt: 'sqn'},
                {name: 'gdc-viewer/View/Export/TrackConfig', label: 'Track Config INI', fileExt: 'conf'},
                {name: 'gdc-viewer/View/Export/TrackConfigJson', label: 'Track Config JSON', fileExt: 'json'}
            ];
        },

        _renderAdditionalTagsDetail: function( track, f, featDiv, container ) {
            var atElement = domConstruct.create(
                'div',
                { className: 'additional',
                innerHTML: '<h2 class="sectiontitle">Information</h2>'
                },
                container )

                var coreDetailsContent = dojo.create('div', { className: 'core', style: 'display: flex; flex-direction: column;' }, atElement );
                var firstRow = dojo.create('div', { style: 'display: flex; flex-direction: row;' }, coreDetailsContent );
                var secondRow = dojo.create('div', { style: 'display: flex; flex-direction: row;' }, coreDetailsContent );
                var thirdRow = dojo.create('div', { style: 'display: flex; flex-direction: row;' }, coreDetailsContent );

                var descriptionSection = dojo.create('div', { style: 'flex-grow:1; flex-basis: 0' }, firstRow)
                this.renderDetailField( descriptionSection, 'gene description', f.get('gene description'), f, undefined, track.store.getTagMetadata('gene description'))

                var aboutSection = dojo.create('div', { style: 'flex-grow:1; flex-basis: 0' }, secondRow)
                var referenceSection = dojo.create('div', { style: 'flex-grow:1; flex-basis: 0' }, secondRow)

                this.renderDetailField( aboutSection, 'about', f.get('about'), f, undefined, track.store.getTagMetadata('about'))
                this.renderDetailField( referenceSection, 'references', f.get('references'), f, undefined, track.store.getTagMetadata('references'))

                var projectSection = dojo.create('div', { style: 'flex-grow:1; flex-basis: 0' }, thirdRow)
                this.renderDetailField( projectSection, 'projects', f.get('projects'), f, undefined, track.store.getTagMetadata('projects'))
        },
   }); 
   }   
);