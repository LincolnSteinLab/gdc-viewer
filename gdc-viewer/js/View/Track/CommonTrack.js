/**
 * Base class for GDC tracks with clickable features
 */
define(
    [
        "dojo/_base/declare",
        'dojo/dom-construct',
        'dijit/form/Button',
        'dijit/form/NumberSpinner',
        'dijit/form/ValidationTextBox',
        './ValidationTextArea',
        './AppliedFiltersEditor'
    ],
   function(
       declare,
       domConstruct,
       Button,
       NumberSpinner,
       ValidationTextBox,
       ValidationTextArea,
       AppliedFiltersEditor) {
   return declare(null, {

    /**
     * Adds additional track menu options
     */
    _trackMenuOptions: function () {
        var options = this.inherited(arguments);
        options.push({ type: 'dijit/MenuSeparator' } );
        options.push({
            label: 'Share Track as URL',
            action: "contentDialog",
            title: 'Share Track as URL',
            content: dojo.hitch(this,'_shareableLinkContent')
        });
        var track = this;
        options.push({
            label: 'View Applied Filters',
            title: 'View Applied Filters',
            action: function() {
                new AppliedFiltersEditor(track)
                    .show();
            }
      })
        return options;
    },

    /**
     * Create a dialog with a shareable link to the current track.
     */
    _shareableLinkContent: function() {
        var track = this;
        var details = domConstruct.create('div', { className: 'detail', style: 'display: flex; flex-direction: column; align-items: center; justify-content: center;' });
        
        var headerString = '<h1 style="width: 80%">Shareable Link</h1>';
        var headerElement = domConstruct.toDom(headerString);
        domConstruct.place(headerElement, details);

        // Create addTracks value
        var addTracksArray = [];
        var addTrackConf = {};
        addTrackConf.label = track.config.label;
        addTrackConf.storeClass = track.store.config.type;
        addTrackConf.type = track.config.type;
        addTrackConf.key = track.config.key;
        addTrackConf.metadata = track.config.metadata;
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
        var helpString = '<span style="width: 80%; font-size: 14px;">Use the following link to share the selected track at the current location.</span>';
        var helpElement = domConstruct.toDom(helpString);
        domConstruct.place(helpElement, details);

        // Create text area with shareable link
        var textArea = domConstruct.create(
            'textarea',{
                rows: 3,
                value: shareableLink,
                style: "width: 80%",
                readOnly: true
            }, details );

        // Create a copy button for text
        var copyButton = new Button({
            label: 'Copy',
            iconClass: 'dijitIconCopy',
            onClick: function() {
                textArea.focus();
                textArea.select();
                document.execCommand("copy");
            }
        }).placeAt(details);

        // Create a DOM element for the link
        var linkString = '<a target="_blank" href="' + shareableLink + '">Open in New Tab</a>';
        var linkElement = domConstruct.toDom(linkString);
        domConstruct.place(linkElement, details);

        return details;
    }
   }); 
   } 
);