/**
 * A Dialog for adding GDC tracks by file ID
 */
define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dojo/aspect',
    'JBrowse/View/Dialog/WithActionBar',
    'dijit/form/TextBox',
    'dijit/form/Button'
],
function (
    declare,
    dom,
    focus,
    aspect,
    ActionBarDialog,
    TextBox,
    Button
) {
    return declare(ActionBarDialog, {

        baseGraphQLUrl: 'https://api.gdc.cancer.gov/v0/graphql',
        // Use for local testing (requires https://github.com/garmeeh/local-cors-proxy)
        // baseGDCFileUrl: 'http://localhost:8010/proxy/data/',
        baseGDCFileUrl: 'https://api.gdc.cancer.gov/data/',

        // Parent DOM to hold results
        dialogContainer: undefined,
        resultsContainer: undefined,

        /**
         * Constructor
         */
        constructor: function () {
            var thisB = this;

            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },

        /**
         * Create a DOM object containing GDC by file id form
         * @return {object} DOM object
         */
        _dialogContent: function () {
            var thisB = this;
            // Container holds all results in the dialog
            thisB.dialogContainer = dom.create('div', { className: 'dialog-container', style: { width: '700px', height: '500px' } });

            // Create header section
            thisB.createHeaderSection();
            

            var tokenTextBox = new TextBox({
                name: "fileId",
                value: "",
                placeHolder: "Enter a file ID"
            }).placeAt(thisB.dialogContainer);

            var searchButton = new Button({
                label: 'Search',
                onClick: function() {
                    thisB.fetchFileMetadata(tokenTextBox.get("value"))
                }
            }).placeAt(thisB.dialogContainer);

            thisB.resultsContainer = dom.create('div', { style: { width: '100%', height: '100%' } }, thisB.dialogContainer);

            thisB.resize();

            return thisB.dialogContainer;
        },

        /**
         * Add a header section with a title
         */
        createHeaderSection: function() {
            var thisB = this;
            var headerSection = dom.create('div', { style: "margin-bottom: 5px;" }, thisB.dialogContainer);
            var aboutMessage = dom.create('h1', { innerHTML: "Add Track By File ID" }, headerSection);
        },

        /**
         * Show callback for displaying dialog
         * @param {*} browser 
         * @param {*} callback 
         */
        show: function (browser, callback) {
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', 'Add Track By File ID');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        },

        fetchFileMetadata: function(fileId) {
            var thisB = this;
            // Create body for GraphQL query
            var fileMetadataQuery = `query Queries($filters: FiltersArgument!) { repository { files { hits(filters: $filters) { total edges { node { file_id file_name file_size access data_category data_format data_type experimental_strategy md5sum state acl index_files { hits { total edges { node { file_id file_name file_size data_category data_format data_type md5sum state } } } } } } } } } } `;
            var bodyVal = {
                query: fileMetadataQuery,
                variables: {
                    "filters": {
                      "op": "=",
                      "content": {
                        "field": "file_id",
                        "value": [
                          fileId
                        ]
                      }
                    }
                  }
            }


            // Clear current results
            dom.empty(thisB.resultsContainer);
            thisB.createLoadingIcon(thisB.resultsContainer);

            fetch(thisB.baseGraphQLUrl + '/fileMetadata', {
                method: 'post',
                headers: { 'X-Requested-With': null, 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyVal)
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                dom.empty(thisB.resultsContainer);
                if (response.data) {
                    thisB.createFileResult(response);
                } else {
                    // Error message
                }
            }).catch(function(err) {
                console.log(err);
                // Error message
            });

        },

        /**
         * Creates file results
         * @param {object} response object returned by graphQL call
         */
        createFileResult: function(response) {
            var thisB = this;

            var file = response.data.repository.files.hits.edges[0].node;

            var fileName = dom.create('p', { innerHTML: "File Name: " + file.file_name }, thisB.resultsContainer);
            var fileId = dom.create('p', { innerHTML: "File Id: " + file.file_id }, thisB.resultsContainer);
            var dataCategory = dom.create('p', { innerHTML: "Data Categorye: " + file.data_category }, thisB.resultsContainer);
            var dataFormat = dom.create('p', { innerHTML: "Data Format: " + file.data_format }, thisB.resultsContainer);
            var dataType = dom.create('p', { innerHTML: "Data Type: " + file.data_type }, thisB.resultsContainer);
            var access = dom.create('p', { innerHTML: "Access: " + file.access }, thisB.resultsContainer);
            var fileSize = dom.create('p', { innerHTML: "File Size: " + file.file_size }, thisB.resultsContainer);
            var state = dom.create('p', { innerHTML: "State: " + file.state }, thisB.resultsContainer);


            var indexFile = file.index_files.hits.edges[0].node

            var indexFileName = dom.create('p', { innerHTML: "Index File Name: " + indexFile.file_name }, thisB.resultsContainer);
            var indexFileId = dom.create('p', { innerHTML: "Index File Id: " + indexFile.file_id }, thisB.resultsContainer);

            // TODO - add track button
            var addTrack = new Button({
                label: 'Add Track',
                onClick: function() {
                    thisB.addTrack(file.file_id, indexFile.file_id)
                }
            }).placeAt(thisB.dialogContainer);

        },

        // For now assumes BAM track
        addTrack: function(fileId, indexFileId) {
            var randomId = Math.random().toString(36).substring(7);
            console.log(this.browser)

            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'JBrowse/Store/SeqFeature/BAM',
                urlTemplate: this.baseGDCFileUrl + fileId,
                baiUrlTemplate: this.baseGDCFileUrl + indexFileId
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);

            var key = 'GDC_BAM';
            var label = key;

            key += '_' + fileId
            label += '_' + fileId + '_' + randomId

            var trackConf = {
                type: 'JBrowse/View/Track/Alignments2',
                store: storeName,
                label: label,
                key: key,
                urlTemplate: this.baseGDCFileUrl + fileId,
                baiUrlTemplate: this.baseGDCFileUrl + indexFileId
            };

            console.log(trackConf)
            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Creates a loading icon in the given location and returns
         * @param {object} location Place to put the loading icon
         * @return {object} loading icon
         */
        createLoadingIcon: function (location) {
            var loadingIcon = dom.create('div', { className: 'loading-gdc' }, location);
            var spinner = dom.create('div', {}, loadingIcon);
            return loadingIcon;
        },
    });
});