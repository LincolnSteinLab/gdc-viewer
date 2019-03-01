define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/layout/TabContainer',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
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
    CheckBox,
    TabContainer,
    AccordionContainer,
    ContentPane,
    Tooltip,
    Menu,
    MenuItem,
    ComboButton,
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        
        projectTableHolder: undefined,
        dialogContainer: undefined,
        // GraphQL
        baseGraphQLUrl: 'https://api.gdc.cancer.gov/v0/graphql',

        constructor: function () {
            var thisB = this;

            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },
        
        _dialogContent: function () {
            var thisB = this;
            // Container holds all results in the dialog
            thisB.dialogContainer = dom.create('div', { className: 'dialog-container', style: { width: '700px', height: '700px' } });

            thisB.getPrimarySiteInformation();

            thisB.resize();
            return thisB.dialogContainer;
        },

        /**
         * Retrieve primary site information from GDC
         */
        getPrimarySiteInformation: function() {
            var thisB = this;
            var url = thisB.baseGraphQLUrl;

            // Clear current results
            dom.empty(thisB.dialogContainer);
            thisB.createLoadingIcon(thisB.dialogContainer);

            // Create body for GraphQL query
            var primarySiteQuery = `query primarySiteQuery { viewer { repository { cases { aggregations { primary_site { buckets { doc_count key } } } } } } }`;

            var bodyVal = {
                query: primarySiteQuery,
                variables: {}
            }

            fetch(url, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: JSON.stringify(bodyVal)
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                dom.empty(thisB.dialogContainer);
                if (response.data) {
                   thisB.createPrimarySiteTable(response);
                } else {
                    var errorMessageHolder = dom.create('div', { style: 'display: flex; flex-direction: column; align-items: center;' }, thisB.dialogContainer);
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
         * @param {*} response 
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
            dom.place(tableNode, thisB.dialogContainer);
        },

        /**
         * Generic function for adding a track of some type
         * @param {*} storeClass 
         * @param {*} primarySite 
         * @param {*} trackType 
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
                }
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
         * @param {*} tooltipText Text to display in tooltip
         */
        addTooltipToButton: function(button, tooltipText) {
            var tooltip = new Tooltip({
                label: tooltipText
            });

            tooltip.addTarget(button);
        },


        /**
         * Creates a loading icon in the given location and returns
         * @param {object} location Place to put the loading icon
         */
        createLoadingIcon: function (location) {
            var loadingIcon = dom.create('div', { className: 'loading-gdc' }, location);
            var spinner = dom.create('div', {}, loadingIcon);
            return loadingIcon;
        },

        /**
         * Generate a GUID
         */
        guid: function() {
            function s4() {
              return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        },

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