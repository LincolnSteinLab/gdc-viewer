define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/layout/TabContainer',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
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
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        // Backbone of the Dialog structure
        facetAndResultsHolder: undefined,
        facetTabHolder: undefined,
        searchResultsTabHolder: undefined,
        searchResultsVerticalHolder: undefined,
        prettyFacetHolder: undefined,

        // Tab holder and tabs for facets
        facetTabs: undefined,
        donorFacetTab: undefined,
        geneFacetTab: undefined,
        mutationFacetTab: undefined,

        // Tab holder and tabs for results
        resultsTabs: undefined,
        donorResultsTab: undefined,
        geneResultsTab: undefined,
        mutationResultsTab: undefined,

        // Accordion for facets
        donorAccordion: undefined,
        geneAccordion: undefined,
        mutationAccordion: undefined,
        accordionId: 0,

        // Available types
        types: ['case', 'ssm', 'gene'],
        caseFacets: ['project.primary_site', 'project.name', 'disease_type' ,'demographic.gender', 'project.program.name', 'diagnoses.vital_status', 'demographic.race', 'demographic.ethnicity'],
        geneFacets: ['biotype', 'is_cancer_gene_census'],
        mutationFacets: ['vep_impact', 'sift_impact', 'polyphen_impact', 'consequence_type', 'type', 'variant_caller', 'cosmic_id', 'dnSNP rsID'],
        constructor: function () {
            var thisB = this;

            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },
        
        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '1000px', height: '700px' } });

            // Unique ID for accordion
            thisB.accordionId = thisB.guid();

            // Create the scaffolding to hold everything
            thisB.createScaffolding(container);

            // Create initial accordions and search results
            for (var type of thisB.types) {
                thisB.createAccordions(type);
                thisB.updateSearchResults(type);
            }

            thisB.resize();
            return container;
        },

        /**
         * Creates the scaffolding to place all of the accordions and search results in
         * @param {object} container Location to place the scaffolding in
         */
        createScaffolding: function (container) {
            var thisB = this;

            // Create main holder
            thisB.facetAndResultsHolder = dom.create('div', { className: 'flexHolder', style: { width: '100%', height: '100%' } }, container);
            
            // Create sections to hold facet tabs and search results tab
            thisB.facetTabHolder = dom.create('div', { style: { 'flex': '1 0 0'} }, thisB.facetAndResultsHolder);
            thisB.searchResultsVerticalHolder = dom.create('div', { style: { 'flex': '3 0 0' } }, thisB.facetAndResultsHolder);

            // Create facet tabs
            thisB.facetTabs = new TabContainer({style: "flex: 1 0 0; "}, thisB.facetTabHolder);

            thisB.donorFacetTab = new ContentPane({
                title: "Cases"
            });
            thisB.facetTabs.addChild(thisB.donorFacetTab);

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
            thisB.prettyFacetHolder = dom.create('div', { style: { 'flex': '3 0 0', 'margin': '5px' } }, thisB.searchResultsVerticalHolder);

            thisB.searchResultsTabHolder = dom.create('div', { style: { width: '100%', height: '100%'  } }, thisB.searchResultsVerticalHolder);
            thisB.resultsTabs = new TabContainer({ style: {width: '100%', height: '100%'  } }, thisB.searchResultsTabHolder);

            thisB.donorResultsTab = new ContentPane({
                title: "Cases"
            });
            thisB.resultsTabs.addChild(thisB.donorResultsTab);

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
         * Creates an accordion of the given type
         * @param {string} type The type of accordion
         */
        createAccordions: function (type) {
            var thisB = this;
            var newAccordionId = 'accordion_' + type + '_' + thisB.accordionId;

            if (type === 'case') {
                thisB.donorAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer" }, thisB.donorFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.donorFacetTab.containerNode);
                thisB.createFacet('case', thisB.donorAccordion, loadingIcon);
            } else if (type === 'ssm') {
                thisB.mutationAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer" }, thisB.mutationFacetTab.containerNode);
                var loadingIcon = thisB.createLoadingIcon(thisB.mutationFacetTab.containerNode);
                thisB.createFacet('ssm', thisB.mutationAccordion, loadingIcon);
            } else if (type === 'gene') {
                thisB.geneAccordion = new AccordionContainer({ id: newAccordionId, className: "accordionContainer" }, thisB.geneFacetTab.containerNode);
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
         */
        createFacet: function (type, accordion, loadingIcon) {
            var thisB = this;

            var url = thisB.createFacetUrl(type);
            fetch(url).then(function (facetsResponse) {
                dom.empty(loadingIcon);
                facetsResponse.json().then(function (facetsJsonResponse) {
                    for (var facet in facetsJsonResponse.data.aggregations) {
                        var contentPane = new ContentPane({
                            title: thisB.prettyFacetName(facet),
                            style: "height: auto",
                            id: facet + '-' + type + '-' + thisB.accordionId
                        });
                        var facetHolder = dom.create('span', { className: "flex-column" });

                        if (facetsJsonResponse.data.aggregations[facet].buckets) {
                            facetsJsonResponse.data.aggregations[facet].buckets.sort(thisB.compareTermElements);
                            facetsJsonResponse.data.aggregations[facet].buckets.forEach((term) => {
                                var facetCheckbox = dom.create('span', { className: "flex-row" }, facetHolder)

                                var checkBox = new CheckBox({
                                    name: facet + '-' + term.key,
                                    id: facet + '-' + term.key + '-' + type + '-' + thisB.accordionId,
                                    value: { "facet": facet, "term" : term.key },
                                }, 'checkbox').placeAt(facetCheckbox);
                                var label = dom.create("label", { "for" : facet + '-' + term.key + '-' + type + '-' + thisB.accordionId, innerHTML: term.key + ' (' + term.doc_count + ')' }, facetCheckbox);
                            });
                        }

                        dojo.place(facetHolder, contentPane.containerNode);
                        accordion.addChild(contentPane);
                    }

                    accordion.startup();
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

            if (type == 'case') {
                dom.empty(thisB.donorResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.donorResultsTab.containerNode);
                
                fetch(url).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                        console.log(facetsJsonResponse)
                        //var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count;
                        var helpMessage = dom.create('div', { innerHTML: "Note: Gene and SSM tracks added through this browser will have all the current filters applied.", style: { 'font-style': 'italic' } }, thisB.donorResultsTab.containerNode);
                        //var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.pagination.from + " to " + endResult + " of " + facetsJsonResponse.pagination.total }, thisB.donorResultsTab.containerNode);
                        thisB.createDonorsTable(facetsJsonResponse.data.hits, thisB.donorResultsTab.containerNode);
                        //thisB.createPaginationButtons(thisB.donorResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.donorPage);
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            } else if (type == 'ssm') {
                dom.empty(thisB.mutationResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.mutationResultsTab.containerNode);
                
                fetch(url).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                        console.log(facetsJsonResponse)
                        //var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count;
                        var helpMessage = dom.create('div', { innerHTML: "Note: Gene and SSM tracks added through this browser will have all the current filters applied.", style: { 'font-style': 'italic' } }, thisB.mutationResultsTab.containerNode);
                        //var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.pagination.from + " to " + endResult + " of " + facetsJsonResponse.pagination.total }, thisB.mutationResultsTab.containerNode);
                        thisB.createMutationsTable(facetsJsonResponse.data.hits, thisB.mutationResultsTab.containerNode);
                        //thisB.createPaginationButtons(thisB.mutationResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.mutationPage);
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            } else if (type == 'gene') {
                dom.empty(thisB.geneResultsTab.containerNode);
                var resultsInfo = thisB.createLoadingIcon(thisB.geneResultsTab.containerNode);
                
                fetch(url).then(function (facetsResponse) {
                    dom.empty(resultsInfo);
                    facetsResponse.json().then(function (facetsJsonResponse) {
                        console.log(facetsJsonResponse)
                        //var endResult = facetsJsonResponse.pagination.from + facetsJsonResponse.pagination.count;
                        var helpMessage = dom.create('div', { innerHTML: "Note: Gene and SSM tracks added through this browser will have all the current filters applied.", style: { 'font-style': 'italic' } }, thisB.geneResultsTab.containerNode);
                        //var resultsInfo = dom.create('div', { innerHTML: "Showing " + facetsJsonResponse.pagination.from + " to " + endResult + " of " + facetsJsonResponse.pagination.total }, thisB.geneResultsTab.containerNode);
                        thisB.createGenesTable(facetsJsonResponse.data.hits, thisB.geneResultsTab.containerNode);
                        //thisB.createPaginationButtons(thisB.geneResultsTab.containerNode, facetsJsonResponse.pagination, type, thisB.genePage);
                        }, function (res3) {
                            console.error('error', res3);
                        });
                    }, function (err) {
                        console.error('error', err);
                    });
            }
        },

        /**
         * Creates the donors table for the given hits in some location
         * @param {List<object>} hits array of donor hits
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
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            for (var hitId in hits) {
                var hit = hits[hitId];

                var donorRowContent = `
                        <td><a target="_blank"  href="https://portal.gdc.cancer.gov/cases/${hit.case_id}">${hit.submitter_id}</a></td>
                        <td>${hit.primary_site}</td>
                        <td>${hit.disease_type}</td>
                `
                var donorRowContentNode = dom.toDom(donorRowContent);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(donorRowContentNode, rowNodeHolder);
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
            var thisB = this;
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

                var donorRowContent = `
                        <td><a target="_blank" href="https://portal.gdc.cancer.gov/genes/${hit.gene_id}">${hit.symbol}</a></td>
                        <td>${hit.name}</td>
                        <td>chr${hit.gene_chromosome}:${hit.gene_start}-${hit.gene_end}</td>
                        <td>${hit.biotype}</td>
                `
                var donorRowContentNode = dom.toDom(donorRowContent);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(donorRowContentNode, rowNodeHolder);
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

                var donorRowContent = `
                        <td><a target="_blank"  href="https://portal.gdc.cancer.gov/ssms/${hit.ssm_id}">${hit.ssm_id}</a></td>
                        <td>${hit.genomic_dna_change}</td>
                        <td>${hit.mutation_type}</td>
                `
                var donorRowContentNode = dom.toDom(donorRowContent);

                var row = `<tr></tr>`;
                var rowNodeHolder = dom.toDom(row);
                dom.place(donorRowContentNode, rowNodeHolder);
                dom.place(rowNodeHolder, rowsHolderNode);

            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        prettyFacetName: function (facetName) {
            var splitFacet = facetName.split('.');
            if (splitFacet.length > 1) {
                facetName = splitFacet[splitFacet.length - 1];
            }
            return facetName.replace('_', ' ');
        },

        createFacetUrl: function(type) {
            var thisB = this;

            var facetURL = 'https://api.gdc.cancer.gov/' + type + 's?size=0&facets=';
            if (type == 'case') {
                facetURL += thisB.caseFacets.join(",");
            } else if (type == 'ssm') {
                facetURL += thisB.mutationFacets.join(",");
            } else if (type == 'gene') {
                facetURL += thisB.geneFacets.join(",");
            }

            return facetURL;
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