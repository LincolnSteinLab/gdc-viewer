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

        // Parent containers to hold form and results
        dialogContainer: undefined,
        searchContainer: undefined,
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

            // Create different sections
            thisB.createHeaderSection();
            thisB.createSearchBar();
            thisB.resultsContainer = dom.create('div', { className: 'flexHolder', }, thisB.dialogContainer);

            thisB.resize();

            return thisB.dialogContainer;
        },

        /**
         * Add a header section with a title
         */
        createHeaderSection: function() {
            var thisB = this;
            var headerSection = dom.create('div', { style: "margin-bottom: 15px;" }, thisB.dialogContainer);
            var aboutMessage = dom.create('h1', { innerHTML: "Add Track By File ID or Name" }, headerSection);
        },

        /**
         * Add a search bar section
         */
        createSearchBar: function() {
            var thisB = this;
            thisB.searchContainer = dom.create('div', { className: 'flexHolder', style: { 'justify-content': 'center', 'align-content': 'center' } }, thisB.dialogContainer);

            var tokenTextBox = new TextBox({
                name: "fileId",
                value: "",
                placeHolder: "Search by file ID or name",
                style: { 'flex': '3 0 0'}
            }).placeAt(thisB.searchContainer);

            var searchButton = new Button({
                label: 'Search',
                style: { 'flex': '1 0 0'},
                onClick: function() {
                    thisB.fetchFileMetadata(tokenTextBox.get("value"))
                }
            }).placeAt(thisB.searchContainer);
        },

        /**
         * Show callback for displaying dialog
         * @param {*} browser
         * @param {*} callback
         */
        show: function (browser, callback) {
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', 'Add Track By File ID or Name');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        },

        fetchFileMetadata: function(fileId) {
            var thisB = this;
            // Create body for GraphQL query
            var fileMetadataQuery = `
                query Queries($filters: FiltersArgument!) {
                  repository {
                    files {
                      hits(filters: $filters) {
                        total
                        edges {
                          node {
                            file_id
                            file_name
                            file_size
                            access
                            data_category
                            data_format
                            data_type
                            experimental_strategy
                            md5sum
                            state
                            acl
                            index_files {
                              hits {
                                total
                                edges {
                                  node {
                                    file_id
                                    file_name
                                    file_size
                                    data_category
                                    data_format
                                    data_type
                                    md5sum
                                    state
                            }}}}
                    }}}}
                  }
                }
            `;
            var bodyVal = {
                query: fileMetadataQuery,
                variables: {
                    "filters": {
                        "op": "or",
                        "content": [
                            {
                                "op": "=",
                                "content": {
                                  "field": "file_id",
                                  "value": [
                                    fileId
                                  ]
                                }
                              },
                              {
                                "op": "=",
                                "content": {
                                  "field": "file_name",
                                  "value": [
                                    fileId
                                  ]
                                }
                              }
                        ]
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
                    if (response.data.repository.files.hits.total > 0) {
                        thisB.createFileResult(response);
                    } else {
                        thisB.createErrorResult(thisB.resultsContainer);
                    }
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

            var results = dom.create('div', { className: 'flexColumnHolder', style: { border: '1px solid #ccc', 'flex': '1 0 0', 'margin-top': '10px', 'padding': '5px' } }, thisB.resultsContainer);

            var fileName = dom.create('div', { innerHTML: file.file_name, style: { 'font-size': '1.2em'} }, results);
            var fileId = dom.create('div', { innerHTML: "File Id: " + file.file_id }, results);
            var dataCategory = dom.create('div', { innerHTML: "Data Category: " + file.data_category }, results);
            var dataFormat = dom.create('div', { innerHTML: "Data Format: " + file.data_format }, results);
            var dataType = dom.create('div', { innerHTML: "Data Type: " + file.data_type }, results);
            var access = dom.create('div', { innerHTML: "Access: " + file.access }, results);
            var fileSize = dom.create('div', { innerHTML: "File Size: " + file.file_size }, results);
            var state = dom.create('div', { innerHTML: "State: " + file.state }, results);

            if (file.index_files.hits.total > 0) {
                var indexFile = file.index_files.hits.edges[0].node

                var indexFileName = dom.create('div', { innerHTML: "Index File Name: " + indexFile.file_name }, results);
                var indexFileId = dom.create('div', { innerHTML: "Index File Id: " + indexFile.file_id }, results);
            }

            var link = dom.create('a', { innerHTML: "View on the GDC", target: "_blank", href: "https://portal.gdc.cancer.gov/files/" + file.file_id }, results);

            fileConf = this.getFileConf(file);
            if (fileConf == null) {
                return;
            }
            var {storeConf, trackConf, missing} = fileConf;

            if (missing.length > 0) {
                dom.create('div', { innerHTML: "Missing Properties: " + missing }, results);
            }

            if (missing.length == 0) {
                new Button({
                    label: 'Add Track',
                    onClick: () => {
                        this.addTrack(storeConf, trackConf);
                    }
                }).placeAt(results);
            }

        },

        getFileConf: function(file) {
            const randomId = Math.random().toString(36).substring(7);

            var missing = [];

            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                urlTemplate: this.baseGDCFileUrl + file.file_id
            };

            var trackConf = {
                key: "GDC_",
                urlTemplate: storeConf['urlTemplate']
            };

            var index_files = file.index_files.hits.edges;

            if (file.data_format == "BAM") {
                trackConf['key'] += "BAM_";
                storeConf['type'] = 'gdc-viewer/Store/SeqFeature/BAM';
                trackConf['type'] = 'JBrowse/View/Track/Alignments2';
                // Must have index file (bai)
                if (file.index_files.hits.total > 0) {
                    storeConf['baiUrlTemplate'] = this.baseGDCFileUrl + index_files[0].node.file_id;
                    trackConf['baiUrlTemplate'] = storeConf['baiUrlTemplate'];
                } else {
                    missing.push('bai');
                }

            } else if (file.data_format == "MAF") {
                trackConf['key'] += "MAF_";
                storeConf['type'] = 'gdc-viewer/Store/SeqFeature/MAF';
                trackConf['type'] = 'JBrowse/View/Track/HTMLFeatures';

            } else if (file.data_format == "TSV") {
                trackConf['key'] += "TSV_";
                if (file.data_category == "Transcriptome Profiling") {
                    if (file.data_type == "Isoform Expression Quantification") {
                        storeConf['type'] = 'gdc-viewer/Store/SeqFeature/IsoformExpressionQuantification';
                        trackConf['type'] = 'JBrowse/View/Track/HTMLFeatures';
                    }

                } else if (file.data_category == "Copy Number Variation") {
                    if (file.data_type == "Gene Level Copy Number") {
                        storeConf['type'] = 'gdc-viewer/Store/SeqFeature/GeneLevelCopyNumber';
                        trackConf['type'] = 'JBrowse/View/Track/HTMLFeatures';
                    }
                }

            } else if (file.data_format == "TXT") {
                trackConf['key'] += "TXT_";
                if (file.data_category == "Copy Number Variation") {
                    if ([
                        "Copy Number Segment",
                        "Masked Copy Number Segment",
                        "Allele-specific Copy Number Segment"
                    ].indexOf(file.data_type) >= 0) {
                        storeConf['type'] = 'gdc-viewer/Store/SeqFeature/SEG';
                        trackConf['type'] = 'JBrowse/View/Track/Wiggle/XYPlot';

                    } else if (file.data_type == "Gene Level Copy Number") {
                        storeConf['type'] = 'gdc-viewer/Store/SeqFeature/GeneLevelCopyNumber';
                        trackConf['type'] = 'JBrowse/View/Track/HTMLFeatures';
                    }

                } else if (file.data_category == "DNA Methylation") {
                    if (file.data_type == "Methylation Beta Value") {
                        storeConf['type'] = 'gdc-viewer/Store/SeqFeature/MethylationBetaValue';
                        trackConf['type'] = 'JBrowse/View/Track/HTMLFeatures';
                    }

                } else if (file.data_category == "Transcriptome Profiling") {
                    if (file.data_type == "Isoform Expression Quantification") {
                        storeConf['type'] = 'gdc-viewer/Store/SeqFeature/IsoformExpressionQuantification';
                        trackConf['type'] = 'JBrowse/View/Track/HTMLFeatures';
                    }
                }

            } else if (file.data_format == "VCF") {
                trackConf['key'] += "VCF_";
                storeConf['type'] = 'gdc-viewer/Store/SeqFeature/VCFTabix';
                trackConf['type'] = 'JBrowse/View/Track/HTMLVariants';
                // Must have index file (tbi)
                if (file.index_files.hits.total > 0) {
                    storeConf['tbiUrlTemplate'] = this.baseGDCFileUrl + index_files[0].node.file_id;
                    trackConf['tbiUrlTemplate'] = storeConf['tbiUrlTemplate'];
                } else {
                    missing.push('tbi');
                }
                // Must be gzipped
                if (!file.file_name.endsWith(".gz")) {
                    delete storeConf['urlTemplate'];
                    delete trackConf['urlTemplate'];
                    missing.push('file');
                }

            }

            if (!('type' in trackConf)) {
                return null;
            }

            trackConf['store'] = this.browser.addStoreConfig(null, storeConf);

            trackConf['key'] += file.file_id;
            trackConf['label'] = trackConf['key'] + '_' + randomId;

            return {storeConf, trackConf, missing};
        },

        addTrack: function(storeConf, trackConf) {
            console.log(storeConf, trackConf);
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Creates a loading icon in the given location and returns
         * @param {object} location Place to put the loading icon
         * @return {object} loading icon
         */
        createLoadingIcon: function (location) {
            var loadingIcon = dom.create('div', { className: 'loading-gdc', style : { 'flex': '1 0 0' } }, location);
            var spinner = dom.create('div', {}, loadingIcon);
            return loadingIcon;
        },

        /**
         * Creates an error message for search results and places at location
         * @param {*} location
         */
        createErrorResult: function (location) {
            var results = dom.create('div', { className: 'flexColumnHolder', style: { border: '1px solid #ccc', 'flex': '1 0 0', 'margin-top': '10px', 'padding': '5px' } }, location);
            var message = dom.create('div', { innerHTML: 'No files were found matching your search' }, results);
        }
    });
});
