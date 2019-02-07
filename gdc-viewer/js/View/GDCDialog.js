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
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        // Available types
        types: ['case', 'ssm', 'gene'],

        // Backbone of the Dialog structure
        facetAndResultsHolder: undefined,
        facetTabHolder: undefined,
        searchResultsTabHolder: undefined,
        searchResultsVerticalHolder: undefined,
        prettyFacetHolder: undefined,

        // Tab holder and tabs for facets
        facetTabs: undefined,
        caseFacetTab: undefined,
        geneFacetTab: undefined,
        mutationFacetTab: undefined,

        // Tab holder and tabs for results
        resultsTabs: undefined,
        caseResultsTab: undefined,
        geneResultsTab: undefined,
        mutationResultsTab: undefined,

        // Accordion for facets
        caseAccordion: undefined,
        geneAccordion: undefined,
        mutationAccordion: undefined,

        // Each filter object shows the current filters applied for a given type
        caseFilters: {
            'project.primary_site': [],
            'project.name': [],
            'disease_type': [],
            'demographic.gender': [],
            'project.program.name': [],
            'diagnoses.vital_status': [],
            'demographic.race': [],
            'demographic.ethnicity': []
        },

        mutationFilters: {
            'consequence.transcript.annotation.vep_impact': [],
            'consequence.transcript.annotation.sift_impact': [],
            'consequence.transcript.annotation.polyphen_impact': [],
            'mutation_subtype': [],
            'occurrence.case.observation.variant_calling.variant_caller': [],
            'consequence.transcript.consequence_type': []
        },

        geneFilters: {
            'biotype': [],
            'is_cancer_gene_census': []
        },

        // Pagination variables
        casePage: 1,
        mutationPage: 1,
        genePage: 1,
        pageSize: 20,

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
            var dialogContainer = dom.create('div', { className: 'dialog-container', style: { width: '1000px', height: '700px' } });

            // Create initial accordions and search results
            thisB.setAccordionsAndSearchResults(dialogContainer);

            thisB.resize();
            return dialogContainer;
        },

        /**
         * Creates the scaffolding to place all of the accordions and search results in
         * @param {object} dialogContainer Location to place the scaffolding in
         */
        createScaffolding: function (dialogContainer) {
            var thisB = this;

            // Create main holder
            thisB.facetAndResultsHolder = dom.create('div', { className: 'flexHolder', style: { width: '100%', height: '100%' } }, dialogContainer);
            
            // Create sections to hold facet tabs and search results tab
            thisB.facetTabHolder = dom.create('div', { style: { 'flex': '1 0 0'} }, thisB.facetAndResultsHolder);
            thisB.searchResultsVerticalHolder = dom.create('div', { style: { 'flex': '3 0 0' } }, thisB.facetAndResultsHolder);

            // Create facet tabs
            thisB.facetTabs = new TabContainer({style: "flex: 1 0 0; "}, thisB.facetTabHolder);

            thisB.caseFacetTab = new ContentPane({
                title: "Cases"
            });
            thisB.facetTabs.addChild(thisB.caseFacetTab);

            thisB.geneFacetTab = new ContentPane({
                title: "Genes"
            });
            thisB.facetTabs.addChild(thisB.geneFacetTab);

            thisB.mutationFacetTab = new ContentPane({
                title: "Mutations"
            });
            thisB.facetTabs.addChild(thisB.mutationFacetTab);

            thisB.facetTabs.startup();

            // Create results tabs
            thisB.prettyFacetHolder = dom.create('div', { style: { 'flex': '3 0 0', 'margin': '5px', 'display': 'flex', 'flex-wrap': 'wrap', 'align-content': 'stretch', 'align-items': 'center' } }, thisB.searchResultsVerticalHolder);

            thisB.searchResultsTabHolder = dom.create('div', { style: { width: '100%', height: '100%'  } }, thisB.searchResultsVerticalHolder);
            thisB.resultsTabs = new TabContainer({ style: {width: '100%', height: '100%'  } }, thisB.searchResultsTabHolder);

            thisB.caseResultsTab = new ContentPane({
                title: "Cases"
            });
            thisB.resultsTabs.addChild(thisB.caseResultsTab);

            thisB.geneResultsTab = new ContentPane({
                title: "Genes"
            });
            thisB.resultsTabs.addChild(thisB.geneResultsTab);
            
            thisB.mutationResultsTab = new ContentPane({
                title: "Mutations"
            });
            thisB.resultsTabs.addChild(thisB.mutationResultsTab);

            thisB.resultsTabs.startup();
        },

        /**
         * Sets the accordions and search results based on the current filters
         */
        setAccordionsAndSearchResults: function(dialogContainer) {
            var thisB = this;

            // Create the scaffolding to hold everything
            thisB.createScaffolding(dialogContainer);

            for (var type of thisB.types) {
                thisB.createAccordions(type);
                thisB.updateSearchResults(type);
            }
        },

        /**
         * Creates an accordion of the given type
         * @param {string} type The type of accordion
         */
        createAccordions: function (type) {
            var thisB = this;
            var newAccordionId = 'accordion_' + type + '_' + thisB.guid();

            if (type === 'case') {
                thisB.caseAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer", style: "overflow: scroll" }, thisB.caseFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.caseFacetTab.containerNode);
                thisB.createFacet('case', thisB.caseAccordion, loadingIcon);
            } else if (type === 'ssm') {
                thisB.mutationAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer", style: "overflow: scroll" }, thisB.mutationFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.mutationFacetTab.containerNode);
                thisB.createFacet('ssm', thisB.mutationAccordion, loadingIcon);
            } else if (type === 'gene') {
                thisB.geneAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer", style: "overflow: scroll" }, thisB.geneFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.geneFacetTab.containerNode);
                thisB.createFacet('gene', thisB.geneAccordion, loadingIcon);
            }
        },

        /**
         * Compare function used for sorting facets
         * @param {*} a 
         * @param {*} b 
         */
        compareTermElements: function(a, b) {
            if (a.key < b.key)
                return -1;
            if (a.key > b.key)
                return 1;
            return 0;
        },

        /**
         * Creates a facet accordion of some type and places them in the given accordion
         * @param {string} type The type of accordion
         * @param {AccordionContainer} accordion The accordion to put the facets in
         * @param {loadingIcon} Holder of the loading icon
         */
        createFacet: function (type, accordion, loadingIcon) {
            var thisB = this;

            var url = thisB.createFacetUrl(type);
            // Fetch the facets for the given type
            fetch(url).then(function (facetsResponse) {
                dom.empty(loadingIcon);
                facetsResponse.json().then(function (facetsJsonResponse) {
                    // Add a content pane per facet group
                    for (var facet in facetsJsonResponse.data.aggregations) {
                        var contentPane = new ContentPane({
                            title: thisB.prettyFacetName(facet),
                            style: "height: auto;",
                            id: facet + '-' + type + '-' + thisB.guid()
                        });
                        var facetHolder = dom.create('span', { className: "flex-column", style: "width: 100%;" });

                        if (facetsJsonResponse.data.aggregations[facet].buckets && facetsJsonResponse.data.aggregations[facet].buckets.length > 0) {
                            facetsJsonResponse.data.aggregations[facet].buckets.sort(thisB.compareTermElements);
                            // Add a checkbox per facet option
                            facetsJsonResponse.data.aggregations[facet].buckets.forEach((term) => {
                                var facetCheckbox = dom.create('span', { className: "flex-row" }, facetHolder)

                                var checkBox = new CheckBox({
                                    name: facet + '-' + term.key,
                                    id: facet + '-' + term.key + '-' + type + '-' + thisB.guid(),
                                    value: { "facet": facet, "term" : term.key },
                                    checked: thisB.isChecked(facet, term.key, thisB.getFiltersForType(type)),
                                    onChange: function(isChecked) {
                                        // On select, add/remove filter from currently
                                        if (isChecked) {
                                            if (type === 'case') {
                                                thisB.caseFilters[this.value.facet].push(this.value.term);
                                            } else if (type === 'ssm') {
                                                thisB.mutationFilters[this.value.facet].push(this.value.term);
                                            } else if (type === 'gene') {
                                                thisB.geneFilters[this.value.facet].push(this.value.term);
                                            }
                                        } else {
                                            if (type === 'case') {
                                                var indexOfValue = thisB.caseFilters[this.value.facet].indexOf(this.value.term);
                                                if (indexOfValue != -1) {
                                                    thisB.caseFilters[this.value.facet].splice(indexOfValue, 1);
                                                }
                                            } else if (type === 'ssm') {
                                                var indexOfValue = thisB.mutationFilters[this.value.facet].indexOf(this.value.term);
                                                if (indexOfValue != -1) {
                                                    thisB.mutationFilters[this.value.facet].splice(indexOfValue, 1);
                                                }
                                            } else if (type === 'gene') {
                                                var indexOfValue = thisB.geneFilters[this.value.facet].indexOf(this.value.term);
                                                if (indexOfValue != -1) {
                                                    thisB.geneFilters[this.value.facet].splice(indexOfValue, 1);
                                                }
                                            }
                                        }
                                        thisB.updateAccordion(type);
                                        thisB.updateSearchResults('case');
                                        thisB.updateSearchResults('ssm');
                                        thisB.updateSearchResults('gene');
                                    }
                                }, 'checkbox').placeAt(facetCheckbox);
                                var label = dom.create("label", { "for" : facet + '-' + term.key + '-' + type + '-' + thisB.guid(), innerHTML: term.key + ' (' + term.doc_count + ')' }, facetCheckbox);
                            });
                        }

                        dojo.place(facetHolder, contentPane.containerNode);
                        accordion.addChild(contentPane);
                    }

                    accordion.startup();
                    accordion.resize();
                    thisB.resize();
                })
            }, function (err) {
                console.error('error', err);
            });
        },

        /**
         * Updates the search results of some type based on the facets
         * @param {string} type The type of accordion
         */
        updateSearchResults: function(type) {
            var thisB = this;
            var url = 'https://api.gdc.cancer.gov/' + type + 's';

            // Clear existing pretty filters
            dom.empty(thisB.prettyFacetHolder);

            // Display currently selected filters
            thisB.prettyPrintFilters(thisB.prettyFacetHolder);

            // Convert the transient filter object into one that GDC can read
            var filterObject = thisB.convertFilterObjectToGDCFilter(thisB.getFiltersForType(type), undefined, undefined, false);
            filterObject = filterObject != '' ? '&filters=' + filterObject : filterObject;

            if (type == 'case') {
                // Clear current results
                dom.empty(thisB.caseResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.caseResultsTab.containerNode);

                // Create URL object
                url += '?from=' + thisB.getStartIndex(thisB.casePage) + '&size=' + thisB.pageSize + filterObject;

                // Fetch the Case results
                fetch(url).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                        var endResult = facetsJsonResponse.data.pagination.from + facetsJsonResponse.data.pagination.count;
                        var helpMessage = dom.create('div', { innerHTML: "Note: Gene and SSM tracks added through this browser will have all the relevant current filters applied.", style: { 'font-style': 'italic' } }, thisB.caseResultsTab.containerNode);
                        var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.data.pagination.from + " to " + endResult + " of " + facetsJsonResponse.data.pagination.total }, thisB.caseResultsTab.containerNode);
                        thisB.createDonorsTable(facetsJsonResponse.data.hits, thisB.caseResultsTab.containerNode);
                        thisB.createPaginationButtons(thisB.caseResultsTab.containerNode, facetsJsonResponse.data.pagination, type, thisB.casePage);
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            } else if (type == 'ssm') {
                // Clear current results
                dom.empty(thisB.mutationResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.mutationResultsTab.containerNode);

                // Create URL object
                url += '?from=' + thisB.getStartIndex(thisB.mutationPage) + '&size=' + thisB.pageSize + filterObject;
                
                // Fetch the SSM results
                fetch(url).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                        var endResult = facetsJsonResponse.data.pagination.from + facetsJsonResponse.data.pagination.count;
                        var helpMessage = dom.create('div', { innerHTML: "Note: Gene and SSM tracks added through this browser will have all the relevant current filters applied.", style: { 'font-style': 'italic' } }, thisB.mutationResultsTab.containerNode);
                        var addMutationsButtonFilters = new Button({
                            iconClass: "dijitIconNewTask",
                            label: "All SSMs With Filters",
                            onClick: function() {
                                thisB.addTrack('SimpleSomaticMutations', undefined, filterObject, 'CanvasVariants');
                                alert("Adding Simple Somatic Mutations track for all mutations with filters.");
                            }
                        }, "addMutationsWithFilters").placeAt(thisB.mutationResultsTab.containerNode);

                        var addMutationsButtonNoFilters = new Button({
                            iconClass: "dijitIconNewTask",
                            label: "All SSMs Without Filters",
                            onClick: function() {
                                thisB.addTrack('SimpleSomaticMutations', undefined, undefined, 'CanvasVariants');
                                alert("Adding Simple Somatic Mutations track for all mutations without filters.");
                            }
                        }, "addMutationsWithoutFilters").placeAt(thisB.mutationResultsTab.containerNode);

                        var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.data.pagination.from + " to " + endResult + " of " + facetsJsonResponse.data.pagination.total }, thisB.mutationResultsTab.containerNode);
                        thisB.createMutationsTable(facetsJsonResponse.data.hits, thisB.mutationResultsTab.containerNode);
                        thisB.createPaginationButtons(thisB.mutationResultsTab.containerNode, facetsJsonResponse.data.pagination, type, thisB.mutationPage);
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            } else if (type == 'gene') {
                // Clear current results
                dom.empty(thisB.geneResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.geneResultsTab.containerNode);
                
                // Create URL object
                url += '?from=' + thisB.getStartIndex(thisB.genePage) + '&size=' + thisB.pageSize + filterObject;
                
                // Fetch the Gene results
                fetch(url).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                        var endResult = facetsJsonResponse.data.pagination.from + facetsJsonResponse.data.pagination.count;
                        var helpMessage = dom.create('div', { innerHTML: "Note: Gene and SSM tracks added through this browser will have all the relevant current filters applied.", style: { 'font-style': 'italic' } }, thisB.geneResultsTab.containerNode);
                        // This needs to use a merged object of all facets
                        var addGenesButtonFilters = new Button({
                            iconClass: "dijitIconNewTask",
                            label: "All Genes With Filters",
                            onClick: function() {
                                thisB.addTrack('Genes', undefined, filterObject, 'CanvasVariants');
                                alert("Adding Gene track for all genes with filters");
                            }
                        }, "addGenesWithFilters").placeAt(thisB.geneResultsTab.containerNode);

                        var addGenesButtonNoFilters = new Button({
                            iconClass: "dijitIconNewTask",
                            label: "All Genes Without Filters",
                            onClick: function() {
                                thisB.addTrack('Genes', undefined, undefined, 'CanvasVariants');
                                alert("Adding Gene track for all genes without filters");
                            }
                        }, "addGenesWithoutFilters").placeAt(thisB.geneResultsTab.containerNode);

                        var addCNVButtonFilters = new Button({
                            iconClass: "dijitIconNewTask",
                            label: "All CNVs With Filters",
                            onClick: function() {
                                thisB.addTrack('CNVs', undefined, filterObject, 'Wiggle/XYPlot');
                                alert("Adding CNV track with filters");
                            }
                        }, "addCNVButtonWithFilters").placeAt(thisB.geneResultsTab.containerNode);

                        var addCNVButtonNoFilters = new Button({
                            iconClass: "dijitIconNewTask",
                            label: "All CNVs Without Filters",
                            onClick: function() {
                                thisB.addTrack('CNVs', undefined, undefined, 'Wiggle/XYPlot');
                                alert("Adding CNV track with no filters");
                            }
                        }, "addCNVButtonNoFilters").placeAt(thisB.geneResultsTab.containerNode);

                        var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.data.pagination.from + " to " + endResult + " of " + facetsJsonResponse.data.pagination.total }, thisB.geneResultsTab.containerNode);
                        thisB.createGenesTable(facetsJsonResponse.data.hits, thisB.geneResultsTab.containerNode);
                        thisB.createPaginationButtons(thisB.geneResultsTab.containerNode, facetsJsonResponse.data.pagination, type, thisB.genePage);
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            }
        },

        /**
         * Creates the cases table for the given hits in some location
         * @param {List<object>} hits array of case hits
         * @param {object} location dom element to place the table
         */
        createDonorsTable: function(hits, location) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Case ID</th>
                    <th>Primary Site</th>
                    <th>Disease Type</th>
                    <th>Genes</th>
                    <th>Mutations</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            for (var hitId in hits) {
                var hit = hits[hitId];

                var caseRowContent = `
                        <td><a target="_blank"  href="https://portal.gdc.cancer.gov/cases/${hit.case_id}">${hit.submitter_id}</a></td>
                        <td>${hit.primary_site}</td>
                        <td>${hit.disease_type}</td>
                `
                var caseRowContentNode = dom.toDom(caseRowContent);

                // Create element to hold buttons
                var geneButtonNode = dom.toDom(`<td></td>`);

                // Create element to hold button (required for tooltips)
                var withFilterNode = dom.toDom(`<span></span>`);

                // Create button and place in parent
                thisB.createDonorGeneButton(hit.id, withFilterNode, thisB.convertFilterObjectToGDCFilter(thisB.geneFilters, hit.case_id, 'case.case_id', false), hit.submitter_id, 'Filtered');
                dom.place(withFilterNode, geneButtonNode)

                // Attach tooltip
                var tooltipWithFilters = new Tooltip({
                    label: "Add all genes for the given donor, filter with current facets"
                });
                
                tooltipWithFilters.addTarget(withFilterNode);

                // Create element to hold button (required for tooltips)
                var withoutFilterNode = dom.toDom(`<span></span>`);

                // Create button and place in parent
                thisB.createDonorGeneButton(hit.id, withoutFilterNode, thisB.convertFilterObjectToGDCFilter(thisB.geneFilters, hit.case_id, 'case.case_id', true), hit.submitter_id, 'All');
                dom.place(withoutFilterNode, geneButtonNode)

                // Attach tooltip
                var tooltipNoFilters = new Tooltip({
                    label: "Add all genes for the given donor, do not filter with current facets"
                });

                tooltipNoFilters.addTarget(withoutFilterNode);

                dom.place(geneButtonNode, caseRowContentNode);

                var ssmButton = `<td></td>`;
                var ssmButtonNode = dom.toDom(ssmButton);
                thisB.createDonorSSMButton(hit.id, ssmButtonNode, thisB.convertFilterObjectToGDCFilter(thisB.mutationFilters, hit.case_id, 'occurrence.case.case_id', false), hit.submitter_id, 'Filtered');
                thisB.createDonorSSMButton(hit.id, ssmButtonNode, thisB.convertFilterObjectToGDCFilter(thisB.mutationFilters, hit.case_id, 'occurrence.case.case_id', true), hit.submitter_id, 'All');

                dom.place(ssmButtonNode, caseRowContentNode);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(caseRowContentNode, rowNodeHolder);
                dom.place(rowNodeHolder, rowsHolderNode);

            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        /**
         * Creates the genes table for the given hits in some location
         * @param {List<object>} hits array of gene hits
         * @param {object} location dom element to place the table
         */
        createGenesTable: function(hits, location) {
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Biotype</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            for (var hitId in hits) {
                var hit = hits[hitId];

                var caseRowContent = `
                        <td><a target="_blank" href="https://portal.gdc.cancer.gov/genes/${hit.gene_id}">${hit.symbol}</a></td>
                        <td>${hit.name}</td>
                        <td>chr${hit.gene_chromosome}:${hit.gene_start}-${hit.gene_end}</td>
                        <td>${hit.biotype}</td>
                `
                var caseRowContentNode = dom.toDom(caseRowContent);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(caseRowContentNode, rowNodeHolder);
                dom.place(rowNodeHolder, rowsHolderNode);

            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        /**
         * Creates the mutations table for the given hits in some location
         * @param {List<object>} hits array of mutation hits
         * @param {object} location dom element to place the table
         */
        createMutationsTable: function(hits, location) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>ID</th>
                    <th>DNA Change</th>
                    <th>Type</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            for (var hitId in hits) {
                var hit = hits[hitId];

                var caseRowContent = `
                        <td><a target="_blank"  href="https://portal.gdc.cancer.gov/ssms/${hit.ssm_id}">${hit.ssm_id}</a></td>
                        <td>${hit.genomic_dna_change}</td>
                        <td>${hit.mutation_type}</td>
                `
                var caseRowContentNode = dom.toDom(caseRowContent);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(caseRowContentNode, rowNodeHolder);
                dom.place(rowNodeHolder, rowsHolderNode);

            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        /**
         * Creates pagination buttons for search results in the given 'holder' using the 'pagination' object from the ICGC response
         * @param {object} holder
         * @param {integer} pagination
         */
        createPaginationButtons: function(holder, pagination, type, pageNum) {
            var thisB = this;

            var paginationHolder = dom.create('div', { style:"display: flex;justify-content: center;"}, holder);
            
            if (pageNum > 1) {
                var previousButton = new Button({
                    label: "Previous",
                    onClick: function() {
                        thisB.previousPage(type);
                    }
                }, "previousButton").placeAt(paginationHolder);

            }

            if (pageNum < pagination.pages) {
                var nextButton = new Button({
                    label: "Next",
                    onClick: function() {
                        thisB.nextPage(type);
                    }
                }, "nextButton").placeAt(paginationHolder);
            }
        },

        /**
         * Loads the facet results at the previous page
         * @param {string} type Page type
         */
        previousPage: function(type) {
            var thisB = this;
            if (type === 'case') {
                thisB.casePage = thisB.casePage - 1;
            } else if (type === 'ssm') {
                thisB.mutationPage = thisB.mutationPage - 1;
            } else if (type === 'gene') {
                thisB.genePage = thisB.genePage - 1;
            }
            thisB.updateSearchResults(type);
        },

        /**
         * Loads the facet results at the next page
         * @param {string} type Page type
         */
        nextPage: function(type) {
            var thisB = this;
            if (type === 'case') {
                thisB.casePage = thisB.casePage + 1;
            } else if (type === 'ssm') {
                thisB.mutationPage = thisB.mutationPage + 1;
            } else if (type === 'gene') {
                thisB.genePage = thisB.genePage + 1;
            }
            thisB.updateSearchResults(type);
        },

        /**
         * Calculate the 'from' parameter for the URL call
         * @param {integer} page current page
         */
        getStartIndex: function(page) {
            var thisB = this;
            return thisB.pageSize * (page - 1) + 1;
        },

        /**
         * Retrieves the filters of some type
         * @param {string} type The type of accordion
         */
        getFiltersForType: function(type) {
            var thisB = this;
            var filters = {};
            if (type === 'case') {
                filters = thisB.caseFilters;
            } else if (type === 'ssm') {
                filters = thisB.mutationFilters;
            } else if (type === 'gene') {
                filters = thisB.geneFilters;
            }
            return filters;
        },

        /**
         * Check if the term is found in the given facet
         * @param {string} facet name of the facet
         * @param {string} term name of option within facet
         * @param {object} filters list of filters to check
         */
        isChecked: function(facet, term, filters) {
            return filters[facet] && filters[facet].indexOf(term) > -1;
        },

        /**
         * Updates the accordion of the given type based on current facets
         * @param {string} type The type of the accordion to update
         */
        updateAccordion: function(type) {
            var thisB = this;
            thisB.destroyAccordions(type);
            thisB.createAccordions(type);
            thisB.casePage = 1;
            thisB.genePage = 1;
            thisB.mutationPage = 1;
        },

        /**
         * Destroys an accordion of the given type
         * @param {string} type The type of accordion
         */
        destroyAccordions: function(type) {
            var thisB = this;
            if (type === 'case') {
                thisB.caseAccordion.destroyDescendants();
            } else if (type === 'ssm') {
                thisB.mutationAccordion.destroyDescendants();
            } else if (type === 'gene') {
                thisB.geneAccordion.destroyDescendants();
            }
        },

        /**
         * Converts a filter object to one that can be passed to the GDC API
         * @param {*} filters 
         * @param {*} caseId 
         */
        convertFilterObjectToGDCFilter: function(filters, caseId, caseField, onlyCase) {
            var gdcFilters = {"op":"and","content":[]};
            
            if (!onlyCase) {
                for (var key in filters) {
                    if (filters[key] != undefined && filters[key].length > 0) {
                        var filterOperation = {"op":"in","content":{"field": "","value": []}};
                        filterOperation.content.field = key
                        filterOperation.content.value = filters[key];
                        gdcFilters.content.push(filterOperation);
                    }
                }
            }

            if (caseId != undefined) {
                var filterOperation = {"op":"in","content":{"field": "","value": []}};
                filterOperation.content.field = caseField;
                filterOperation.content.value = caseId;
                gdcFilters.content.push(filterOperation);
            }

            if (gdcFilters.content != undefined && gdcFilters.content.length > 0) {
                var stringGDCFilters = JSON.stringify(gdcFilters)
                return encodeURI(stringGDCFilters);
            } else {
                return '';
            }
        },

        /**
         * Combines all three types of filters into one encoded filter string
         */
        combineAllFilters: function() {
            var thisB = this;
            var combinedFilters = Object.assign({}, thisB.caseFilters, thisB.mutationFilters, thisB.geneFilters);
            return decodeURI(thisB.convertFilterObjectToGDCFilter(combinedFilters, null, null, false));
        },

        /**
         * Pretty prints the current filters
         * @param {object} location  place to display the filters
         */
        prettyPrintFilters: function(location) {
            var thisB = this;
            var combinedFilters = Object.assign({}, thisB.caseFilters, thisB.mutationFilters, thisB.geneFilters);

            // remove any objects with empty array
            var hasFilter = false
            var filteredCombinedFilters = {}
            for (var key in combinedFilters) {
                if (combinedFilters[key] != undefined && combinedFilters[key].length > 0) {
                    filteredCombinedFilters[key] = combinedFilters[key];
                    hasFilter = true
                }
            }

            if (hasFilter) {
                var clearFacetButton = new Button({
                    iconClass: "dijitIconDelete",
                    onClick: function() {
                        thisB.clearFacets()
                    }
                }, "clearFacets").placeAt(location);
            }

            var currentFilter = 0;
            var prettyFacetString = "";
            var filterCount = Object.keys(filteredCombinedFilters).length;

            for (var key in filteredCombinedFilters) {
                if (filteredCombinedFilters[key] != undefined && filteredCombinedFilters[key].length > 0) {
                    var facetString = `<span class="filterNameGDC">${key}</span>`;
                    if (filteredCombinedFilters[key].length > 1) {
                        facetString += ` <strong><span class="joinWordGDC">IN</span> ( </strong>`;
                        filteredCombinedFilters[key].forEach(function(value, i) {
                            facetString += `<span class="filterValueGDC">${value}</span>`;
                        });
                        facetString += `<strong> )</strong>`;
                    } else {
                        facetString += ` <strong class="joinWordGDC">IS </strong><span class="filterValueGDC">${filteredCombinedFilters[key]}</span>`;
                    }

                    if (currentFilter < filterCount - 1) {
                        facetString += ` <strong class="joinWordGDC">AND</strong> `;
                    }
                    facetString += `</span>`;
                    prettyFacetString += facetString;
                }
                currentFilter++;
            }
            var node = dom.toDom(prettyFacetString);
            dom.place(node, location);
        },

        /**
         * Pretty prints a facet name
         * @param {*} facetName 
         */
        prettyFacetName: function (facetName) {
            const splitFacetName = facetName.split('.');
            if (splitFacetName.length > 1) {
                facetName = splitFacetName[splitFacetName.length - 1];
            }
            return facetName.replace(/_/g, ' ');
        },

        /**
         * Creates a facet url for the given type applying all filters
         * @param {*} type 
         */
        createFacetUrl: function(type) {
            var thisB = this;

            var facetURL = 'https://api.gdc.cancer.gov/' + type + 's?size=0&facets=';
            var filterObj = thisB.convertFilterObjectToGDCFilter(thisB.getFiltersForType(type), undefined, undefined, false);
            if (type == 'case') {
                facetURL += Object.keys(thisB.caseFilters).join(",");
                facetURL += filterObj == '' ? '' : '&filters=' + filterObj;
            } else if (type == 'ssm') {
                facetURL += Object.keys(thisB.mutationFilters).join(",");
                facetURL += filterObj == '' ? '' : '&filters=' + filterObj;
            } else if (type == 'gene') {
                facetURL += Object.keys(thisB.geneFilters).join(",");
                facetURL += filterObj == '' ? '' : '&filters=' + filterObj;
            }

            return facetURL;
        },

        /**
         * Clears all of the facets
         */
        clearFacets: function() {
            var thisB = this;
            for (var key in thisB.caseFilters) {
                thisB.caseFilters[key] = []
            }
            for (var key in thisB.geneFilters) {
                thisB.geneFilters[key] = []
            }
            for (var key in thisB.mutationFilters) {
                thisB.mutationFilters[key] = []
            }

            for (var type of thisB.types) {
                thisB.updateAccordion(type);
                thisB.updateSearchResults(type);
            }
        },

        /**
         * Create a button to add a case gene button that will create a gene track based on the given
         * case ID and facet object
         * @param {string} caseId Id of case
         * @param {object} holder Div to place the button in
         * @param {object} combinedFacetObject combined object of facets
         */
        createDonorGeneButton: function(caseId, holder, combinedFacetObject, prettyId, text) {
            var thisB = this;
            var geneButton = new Button({
                iconClass: "dijitIconNewTask",
                label: text,
                onClick: function() {
                    thisB.addTrack('Genes', caseId, combinedFacetObject, 'CanvasVariants');
                    alert("Adding Gene track for case " + prettyId);
                }
            }).placeAt(holder);
        },

        /**
         * Create a button to add a case ssm button that will create a ssm track based on the given
         * case ID and facet object
         * @param {string} caseId Id of case
         * @param {object} holder Div to place the button in
         * @param {object} combinedFacetObject combined object of facets
         */
        createDonorSSMButton: function(caseId, holder, combinedFacetObject, prettyId, text) {
            var thisB = this;
            var ssmButton = new Button({
                iconClass: "dijitIconNewTask",
                label: text,
                onClick: function() {
                    thisB.addTrack('SimpleSomaticMutations', caseId, combinedFacetObject, 'CanvasVariants');
                    alert("Adding Simple Somatic Mutation track for case " + prettyId);
                }
            }, "ssmButton").placeAt(holder);
        },

        /**
         * Generic function for adding a track of some type
         * @param {*} storeClass 
         * @param {*} caseId 
         * @param {*} combinedFacetObject 
         * @param {*} trackType 
         */
        addTrack: function (storeClass, caseId, combinedFacetObject, trackType) {
            if (combinedFacetObject !== undefined) {
                combinedFacetObject = combinedFacetObject.replace('&filters=', '')
                combinedFacetObject = decodeURI(combinedFacetObject)
                if (combinedFacetObject === '') {
                    combinedFacetObject = undefined
                }
            }

            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'gdc-viewer/Store/SeqFeature/' + storeClass,
                donor: caseId,
                filters: combinedFacetObject
            };
            var storeName = this.browser.addStoreConfig(null, storeConf);
            var randomId = Math.random().toString(36).substring(7);

            var key = 'GDC_' + storeClass;
            var label = key + '_' + randomId;

            if (caseId != null && caseId != undefined) {
                key += '_' + caseId
                label += '_' + caseId
            }

            var trackConf = {
                type: 'JBrowse/View/Track/' + trackType,
                store: storeName,
                label: label,
                key: key,
                metadata: {
                    datatype: storeClass,
                    donor: caseId
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
         * Creates a loading icon in the given location and returns
         * @param {object} location Place to put the loading icon
         */
        createLoadingIcon: function (location) {
            var loadingIcon = dom.create('div', { className: 'loading-icgc' }, location);
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
            this.set('title', 'GDC Browser');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }
        
    });
});