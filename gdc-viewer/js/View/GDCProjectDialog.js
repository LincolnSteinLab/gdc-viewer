/**
 * A Dialog for adding GDC tracks by project
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

        // Current page
        page: 1,
        // Page size
        size: 20,

        _dialogContent: function () {
            var thisB = this;
            // Container holds all results in the dialog
            thisB.dialogContainer = dom.create('div', { className: 'dialog-container', style: { width: '1200px', height: '700px' } });

            // Create header section
            thisB.createHeaderSection();

            // Update the project table
            thisB.resultsContainer = dom.create('div', { style: { width: '100%', height: '100%' } }, thisB.dialogContainer);
            thisB.getProjectInformation();
            thisB.resize();

            return thisB.dialogContainer;
        },

        /**
         * Add a header section with a title
         */
        createHeaderSection: function() {
            var thisB = this;
            var headerSection = dom.create('div', { style: "margin-bottom: 5px;" }, thisB.dialogContainer);
            var aboutMessage = dom.create('h1', { innerHTML: "View projects available on the GDC Data Portal" }, headerSection);
        },

        /**
         * Retrieve project information from GDC
         */
        getProjectInformation: function() {
            var thisB = this;
            var url = thisB.baseGraphQLUrl + '/projects-dialog';

            // Clear current results
            dom.empty(thisB.resultsContainer);
            thisB.createLoadingIcon(thisB.resultsContainer);

            // Create body for GraphQL query
            var projectQuery = `query Projects($size: Int, $offset: Int, $sort: [Sort]) { projectsViewer: viewer { projects { hits(first: $size, offset: $offset, sort: $sort) { total pageInfo { hasNextPage hasPreviousPage } edges { node { id project_id name disease_type program { name } primary_site summary { case_count } } } } } } }`;

            var bodyVal = {
                query: projectQuery,
                variables: {
                    "sort": [{"field": "summary.case_count", "order": "desc"}],
                    "size": thisB.size,
                    "offset": thisB.size * (thisB.page - 1)
                  }
            }

            fetch(url, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: JSON.stringify(bodyVal)
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                dom.empty(thisB.resultsContainer);
                if (response.data) {
                    var totalHits = response.data.projectsViewer.projects.hits.total;
                    var totalPages = totalHits / thisB.size;
                    var startIndex = thisB.size * (thisB.page - 1) + 1;
                    var endIndex = thisB.size * (thisB.page - 1) + thisB.size;
                    if (endIndex > totalHits) {
                        endIndex = totalHits;
                    }
                    var resultsInfo = dom.create('div', { innerHTML: "Showing " + startIndex + " to " + endIndex + " of " + totalHits }, thisB.resultsContainer);

                    thisB.createProjectsTable(response);
                    thisB.createPaginationButtons(totalPages);
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
                    thisB.getProjectInformation();
                }
            }).placeAt(errorMessageHolder);
        },

        /**
         * Creates a table with projects
         * @param {object} response Object returned from GraphQL call
         */
        createProjectsTable: function(response) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Project</th>
                    <th>Disease Type</th>
                    <th>Primary Site</th>
                    <th>Program</th>
                    <th>Cases</th>
                    <th>Actions</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            if (response.data) {
                for (var hitId in response.data.projectsViewer.projects.hits.edges) {
                    var hit = response.data.projectsViewer.projects.hits.edges[hitId].node;

                    var projectRowContent = `
                            <td><a target="_blank"  href="https://portal.gdc.cancer.gov/projects/${hit.project_id}">${hit.project_id}</a></td>
                            <td>${hit.disease_type}</td>
                            <td>${hit.primary_site}</td>
                            <td>${hit.program.name}</td>
                            <td>${(hit.summary.case_count).toLocaleString()}</td>
                    `
                    var projectRowContentNode = dom.toDom(projectRowContent);

                    // Create element to hold buttons
                    var projectButtonNode = dom.toDom(`<td></td>`);

                    // Create dropdown button with elements
                    var geneMenu = new Menu({ style: "display: none;"});

                    var menuItemSSM = new MenuItem({
                        label: "SSMs for Project",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('SimpleSomaticMutations', hit.project_id, 'gdc-viewer/View/Track/SSMTrack');
                                alert("Adding SSM track for project " + hit.project_id);
                            }
                        })(hit)
                    });
                    geneMenu.addChild(menuItemSSM);

                    var menuItemGene = new MenuItem({
                        label: "Genes for Project",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('Genes', hit.project_id, 'gdc-viewer/View/Track/GeneTrack');
                                alert("Adding Gene track for project " + hit.project_id);
                            }
                        })(hit)
                    });
                    geneMenu.addChild(menuItemGene);

                    var menuItemCNV = new MenuItem({
                        label: "CNVs for Project",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('CNVs', hit.project_id, 'JBrowse/View/Track/Wiggle/XYPlot');
                                alert("Adding CNV track for project " + hit.project_id);
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
                    thisB.addTooltipToButton(menuItemGene, "Add track with all genes for the given project");
                    thisB.addTooltipToButton(menuItemCNV, "Add track with all CNVs for the given project");
                    thisB.addTooltipToButton(menuItemSSM, "Add track with all SSMs for the given project");

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
         * @param {string} projectId the project ID to filter by
         * @param {string} trackType the JBrowse track type
         */
        addTrack: function (storeClass, projectId, trackType) {
            var projectFilters = {"op":"in","content":{"field": "cases.project.project_id","value": projectId}};
            
            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'gdc-viewer/Store/SeqFeature/' + storeClass,
                project: projectId,
                filters: JSON.stringify(projectFilters)
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);
            var randomId = Math.random().toString(36).substring(7);

            var key = 'GDC_' + storeClass;
            var label = key + '_' + randomId;

            key += '_' + projectId
            label += '_' + projectId

            var trackConf = {
                type: trackType,
                store: storeName,
                label: label,
                key: key,
                metadata: {
                    datatype: storeClass,
                    project: projectId
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
         * Creates pagination buttons for search results in the given 'holder' using the 'pagination' object from the GDC response
         * @param {number} totalPages total number of pages
         */
        createPaginationButtons: function(totalPages) {
            var thisB = this;

            var paginationHolder = dom.create('div', { style:"display: flex;justify-content: center;"}, thisB.resultsContainer);
            
            if (thisB.page > 1) {
                var previousButton = new Button({
                    label: "Previous",
                    onClick: function() {
                        thisB.page -= 1;
                        thisB.getProjectInformation();
                    }
                }, "previousButton").placeAt(paginationHolder);

            }

            if (thisB.page < totalPages) {
                var nextButton = new Button({
                    label: "Next",
                    onClick: function() {
                        thisB.page += 1;
                        thisB.getProjectInformation();
                    }
                }, "nextButton").placeAt(paginationHolder);
            }
        },

        /**
         * Show callback for displaying dialog
         * @param {*} browser 
         * @param {*} callback 
         */
        show: function (browser, callback) {
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', 'GDC Project Browser');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }
        
    });
});