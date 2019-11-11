/**
 * A Dialog for adding GDC tracks by primary site
 */
define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/Menu',
    'dijit/MenuItem',
    'dijit/form/ComboButton',
    './BaseGDCDialog'

],
function (
    declare,
    dom,
    focus,
    Button,
    Menu,
    MenuItem,
    ComboButton,
    BaseGDCDialog
) {
    return declare(BaseGDCDialog, {
        // Parent DOM to hold results
        dialogContainer: undefined,
        resultsContainer: undefined,

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

            fetch(thisB.baseGraphQLUrl + '/primarySites', {
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
                    thisB.createHardRefreshMessage(thisB.resultsContainer);
                }
            }).catch(function(err) {
                console.log(err);
                thisB.createHardRefreshMessage(thisB.resultsContainer);
            });
        },

        /**
         * Adds a error message to the given location along with a button to hard refresh the results
         * @param {*} location 
         */
        createHardRefreshMessage: function(location) {
            var thisB = this;
            var errorMessageHolder = dom.create('div', { style: 'display: flex; flex-direction: column; align-items: center;' }, location);
            var errorMessage = dom.create('div', { innerHTML: 'There was an error contacting GDC.' }, errorMessageHolder);
            var hardRefreshButton = new Button({
                label: 'Refresh Results',
                onClick: function() {
                    thisB.getPrimarySiteInformation();
                }
            }).placeAt(errorMessageHolder);
        },

        /**
         * Creates a table with primary sites
         * @param {object} response object returned by graphQL call
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
                                thisB.addTrack('SimpleSomaticMutations', hit.key, 'gdc-viewer/View/Track/SSMTrack');
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
                                thisB.addTrack('Genes', hit.key, 'gdc-viewer/View/Track/GeneTrack');
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
                                thisB.addTrack('CNVs', hit.key, 'gdc-viewer/View/Track/CNVTrack');
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
                type: trackType,
                store: storeName,
                label: label,
                key: key,
                metadata: {
                    datatype: storeClass,
                    primarySite: primarySite
                },
                unsafePopup: true,
                menuTemplate : [ 
                    {   
                     label : "View details",
                   }
               ] 
            };

            if (storeClass === 'CNVs') {
                trackConf.autoscale = 'local';
                trackConf.bicolor_pivot = 0;
            } else if (storeClass === 'Genes') {
                trackConf.menuTemplate.push(
                    {   
                        label : "Highlight this Gene",
                    },
                    {
                        label : "View gene on GDC",
                        iconClass : "dijitIconSearch",
                        action: "newWindow",
                        url : function(track, feature) { return "https://portal.gdc.cancer.gov/genes/" + feature.get('about')['id'] }
                    }
                );
            } else if (storeClass === 'SimpleSomaticMutations') {
                trackConf.menuTemplate.push(
                    {   
                        label : "Highlight this Simple Somatic Mutation",
                    },
                    {
                        label : "View SSM on GDC",
                        iconClass : "dijitIconSearch",
                        action: "newWindow",
                        url : function(track, feature) { return "https://portal.gdc.cancer.gov/ssms/" + feature.get('about')['id'] }
                    }
                );
            }

            console.log("Adding track of type " + trackType + " and store class " + storeClass + ": " + key + " (" + label + ")");

            trackConf.store = storeName;
            this.browser.publish('/jbrowse/v1/v/tracks/new', [trackConf]);
            this.browser.publish('/jbrowse/v1/v/tracks/show', [trackConf]);
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