define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/Tooltip',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/form/ComboButton',
    'dojo/aspect',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    focus,
    Button,
    Tooltip,
    Menu,
    MenuItem,
    ComboButton,
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        // Parent DOM to hold results
        dialogContainer: undefined,
        resultsContainer: undefined,

        // The base URL for GraphQL calls
        baseGraphQLUrl: 'https://api.gdc.cancer.gov/v0/graphql',

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
         * Create a DOM object containing GDC primary site interface
         * @return {object} DOM object
         */
        _dialogContent: function () {
            var thisB = this;
            // Container holds all results in the dialog
            thisB.dialogContainer = dom.create('div', { className: 'dialog-container', style: { width: '700px', height: '700px' } });

            // Create header section
            thisB.createHeaderSection();

            // Update the primary site table
            thisB.resultsContainer = dom.create('div', { style: { width: '100%', height: '100%' } }, thisB.dialogContainer);
            thisB.getPrimarySiteInformation();
            thisB.resize();

            return thisB.dialogContainer;
        },

        /**
         * Add a header section with a title
         */
        createHeaderSection: function() {
            var thisB = this;
            var headerSection = dom.create('div', { style: "margin-bottom: 5px;" }, thisB.dialogContainer);
            var aboutMessage = dom.create('h1', { innerHTML: "View primary sites available on the GDC Data Portal" }, headerSection);
        },

        /**
         * Retrieve primary site information from GDC and display as a table
         */
        getPrimarySiteInformation: function() {
            var thisB = this;

            // Clear current results
            dom.empty(thisB.resultsContainer);
            thisB.createLoadingIcon(thisB.resultsContainer);

            // Create body for GraphQL query
            var primarySiteQuery = `query primarySiteQuery { viewer { repository { cases { aggregations { primary_site { buckets { doc_count key } } } } } } }`;
            var bodyVal = {
                query: primarySiteQuery,
                variables: {}
            }

            fetch(thisB.baseGraphQLUrl, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: JSON.stringify(bodyVal)
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                dom.empty(thisB.resultsContainer);
                if (response.data) {
                    thisB.createPrimarySiteTable(response);
                } else {
                    var errorMessageHolder = dom.create('div', { style: 'display: flex; flex-direction: column; align-items: center;' }, thisB.resultsContainer);
                    var errorMessage = dom.create('div', { innerHTML: 'There was an error contacting GDC.' }, errorMessageHolder);
                    var hardRefreshButton = new Button({
                        label: 'Refresh Results',
                        onClick: function() {
                            thisB.getPrimarySiteInformation();
                        }
                    }).placeAt(errorMessageHolder);
                }
            }).catch(function(err) {
                console.log(err);
            });
        },

        /**
         * Creates a table with primary sites
         * @param {*} response object returned by graphQL call
         */
        createPrimarySiteTable: function(response) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Primary Site</th>
                    <th>Cases</th>
                    <th>Actions</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            if (response.data) {
                for (var hitId in response.data.viewer.repository.cases.aggregations.primary_site.buckets) {
                    var hit = response.data.viewer.repository.cases.aggregations.primary_site.buckets[hitId];

                    var projectRowContent = `
                            <td>${hit.key}</td>
                            <td>${(hit.doc_count).toLocaleString()}</td>
                    `
                    var projectRowContentNode = dom.toDom(projectRowContent);

                    // Create element to hold buttons
                    var projectButtonNode = dom.toDom(`<td></td>`);

                    // Create dropdown button with elements
                    var geneMenu = new Menu({ style: "display: none;"});

                    var menuItemSSM = new MenuItem({
                        label: "SSMs for Primary Site",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('SimpleSomaticMutations', hit.key, 'CanvasVariants');
                                alert("Adding SSM track for primary site " + hit.key);
                            }
                        })(hit)
                    });
                    geneMenu.addChild(menuItemSSM);

                    var menuItemGene = new MenuItem({
                        label: "Genes for Primary Site",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('Genes', hit.key, 'CanvasVariants');
                                alert("Adding Gene track for primary site " + hit.key);
                            }
                        })(hit)
                    });
                    geneMenu.addChild(menuItemGene);

                    var menuItemCNV = new MenuItem({
                        label: "CNVs for Primary Site",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('CNVs', hit.key, 'Wiggle/XYPlot');
                                alert("Adding CNV track for primary site " + hit.key);
                            }
                        })(hit)
                    });
                    geneMenu.addChild(menuItemCNV);

                    geneMenu.startup();

                    var buttonAllGenes = new ComboButton({
                        label: "Add Tracks",
                        iconClass: "dijitIconNewTask",
                        dropDown: geneMenu
                    });
                    buttonAllGenes.placeAt(projectButtonNode);
                    buttonAllGenes.startup();

                    // Add  tooltips
                    thisB.addTooltipToButton(menuItemGene, "Add track with all genes for the given primary site");
                    thisB.addTooltipToButton(menuItemCNV, "Add track with all CNVs for the given primary site");
                    thisB.addTooltipToButton(menuItemSSM, "Add track with all SSMs for the given primary site");

                    // Place buttons in table
                    dom.place(projectButtonNode, projectRowContentNode);

                    var row = `<tr></tr>`;
                    var rowNodeHolder = dom.toDom(row);
                    dom.place(projectRowContentNode, rowNodeHolder);
                    dom.place(rowNodeHolder, rowsHolderNode);

                }
            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, thisB.resultsContainer);
        },

        /**
         * Generic function for adding a track of some type
         * @param {string} storeClass the JBrowse store class
         * @param {string} primarySite the primary site to filter by
         * @param {string} trackType the JBrowse track type
         */
        addTrack: function (storeClass, primarySite, trackType) {
            var primarySiteFilters = {"op":"in","content":{"field": "cases.primary_site","value": primarySite}};
            
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'gdc-viewer/Store/SeqFeature/' + storeClass,
                primarySite: primarySite,
                filters: JSON.stringify(primarySiteFilters)
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);
            var randomId = Math.random().toString(36).substring(7);

            var key = 'GDC_' + storeClass;
            var label = key + '_' + randomId;

            key += '_' + primarySite
            label += '_' + primarySite

            var trackConf = {
                type: 'JBrowse/View/Track/' + trackType,
                store: storeName,
                label: label,
                key: key,
                metadata: {
                    datatype: storeClass,
                    primarySite: primarySite
                },
                unsafePopup: true
            };

            if (storeClass === 'CNVs') {
                trackConf.autoscale = 'local';
                trackConf.bicolor_pivot = 0;
            }

            console.log("Adding track of type " + trackType + " and store class " + storeClass + ": " + key + " (" + label + ")");

            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
        },

        /**
         * Adds a tooltip with some text to a location
         * @param {*} button Location to attach tooltip
         * @param {*} text Text to display in tooltip
         */
        addTooltipToButton: function(button, text) {
            var tooltip = new Tooltip({
                label: text
            });

            tooltip.addTarget(button);
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

        /**
         * Generate a GUID
         * @return {string} GUID
         */
        guid: function() {
            function s4() {
              return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

        /**
         * Show callback for displaying dialog
         * @param {*} browser 
         * @param {*} callback 
         */
        show: function (browser, callback) {
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', 'GDC Primary Site Browser');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }
        
    });
});