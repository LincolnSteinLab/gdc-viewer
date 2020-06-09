/**
 * Create dialog showing applied filters for the given track.
 * User can apply new filters here too.
 */
define([
    'dojo/_base/declare',
    'dojo/aspect',
    'dojo/json',
    'dojo/dom-construct',
    'dijit/Dialog',
    'dijit/form/Button',
    'dijit/form/NumberSpinner',
    'dijit/form/ValidationTextBox',
    './ValidationTextArea',
],
function(
    declare,
    aspect,
    JSON,
    dom,
    Dialog,
    Button,
    NumberSpinner,
    ValidationTextBox,
    ValidationTextArea
) {

return declare( null, {

    constructor: function( track ) {
        this.track = track;
    },

    show: function( editCallback, cancelCallback ) {
        var dialog = this.dialog = new Dialog(
            { title: "Track Filters", className: 'appliedFiltersEditor' }
            );

        var content = [
            this._makeEditControls().domNode
        ];
        dialog.set( 'content', content );
        dialog.show();

        aspect.after( dialog, 'hide', dojo.hitch( this, function() {
                            setTimeout( function() {
                                dialog.destroyRecursive();
                            }, 500 );
                    }));
    },

    _makeEditControls: function() {
        var details = dom.create('div', { className: 'detail', style: 'display: flex; flex-direction: column; align-items: center; justify-content: center;' });
        
        // Create header text
        var headerString = '<h1 style="width: 80%; margin-bottom: 5px;">View and Update Filters Applied To The Current Track</h1>';
        var headerElement = dom.toDom(headerString);
        dom.place(headerElement, details);

        // Create filter help text
        var helpString = '<span style="width: 80%; font-size: 14px;">The following filters have been applied to the track. You can update the filters here, though only basic validation is done on the input.</span>';
        var helpElement = dom.toDom(helpString);
        dom.place(helpElement, details);

        var filterString = '<div style="width: 80%"><h3>Filters</h3><span>Filters narrow down the features displayed on the track. We use the same format as the <a href="https://docs.gdc.cancer.gov/API/Users_Guide/GraphQL_Examples/" target="_nblank">GDC GraphQL API</a>.</span></div>';
        var filterElement = dom.toDom(filterString);
        dom.place(filterElement, details);

        // Display filtered text
        var filteredText = JSON.stringify(this.track.store.filters, null, 2)

        var textArea = new ValidationTextArea({
            rows: 20,
            value: filteredText,
            style: "width: 80%",
            readOnly: false,
            id: "filterTextArea",
            invalidMessage: "Invalid JSON filter - must be a valid JSON",
            isValid: function() {
                var value = this.attr('value')
                try {
                  JSON.parse(value)
                } catch (e) {
                    return false;
                }
                return true;
              }
        }).placeAt(details);

        // Display cases
        var caseString = '<div style="width: 80%"><h3>Case UUIDs</h3><span>Comma separated unique identifiers for the case, expressed as UUIDs.</span></div>';
        var caseElement = dom.toDom(caseString);
        dom.place(caseElement, details);

        var caseIdTextBox = new ValidationTextBox({
            value: this.track.store.config.case,
            style: "width: 80%",
            id: "caseTextBox",
            regExp: "^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(,[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})*$",
            invalidMessage: "Invalid Case UUID - Must be version 4 UUID",
            trim: true
        }).placeAt(details);

        // Display size
        var sizeHeader = '<div style="width: 80%"><h3>Size</h3><span>This is the maximum number of results to return per panel.</span></div>';
        var sizeElement = dom.toDom(sizeHeader);
        dom.place(sizeElement, details);

        var sizeTextBox = new NumberSpinner({
            value: this.track.store.size,
            style: "width: 80%",
            id: "sizeTextBox",
            constraints: { min: 1, max: 2000, places: 0 },
            smallDelta: 10
        }).placeAt(details);

        var actionBar = dom.create(
            'div', {
                className: 'dijitDialogPaneActionBar'
            }, details);


        var closeButton = new Button({
            iconClass: 'dijitIconDelete',
            label: 'Cancel',
            onClick: dojo.hitch( this, function() {
                                this.dialog.hide();
                            })
            })
            .placeAt( actionBar );
            
        // Add button to update the track with changed content
        var updateTrackButton = new Button({
            label: 'Apply',
            iconClass: 'dijitIconSave',
            onClick: dojo.hitch( this, function() {
                const trackString = document.getElementById("filterTextArea").value;
                const caseString = document.getElementById("caseTextBox").value;
                const sizeString = document.getElementById("sizeTextBox").value;
                var storeConf = {
                    browser: this.track.browser,
                    refSeq: this.track.browser.refSeq,
                    type: this.track.store.config.type,
                    case: caseString,
                    size: sizeString,
                    filters: trackString
                };
                var storeName = this.track.browser.addStoreConfig(null, storeConf);
                this.track.config.store = storeName;
                this.track.browser.publish( '/jbrowse/v1/v/tracks/replace', [this.track.config] );
                this.dialog.hide();
            })
        }).placeAt(actionBar);

        // Change listeners for text boxes
        caseIdTextBox.on('change', function(e) {
            updateTrackButton.set('disabled', !caseIdTextBox.validate() || !sizeTextBox.validate() || !textArea.validate())
        });

        sizeTextBox.on('change', function(e) {
            updateTrackButton.set('disabled', !caseIdTextBox.validate() || !sizeTextBox.validate() || !textArea.validate())
        });

        textArea.on('change', function(e) {
            updateTrackButton.set('disabled', !caseIdTextBox.validate() || !sizeTextBox.validate() || !textArea.validate())
        });

        return { domNode: details };
    },

});
});
