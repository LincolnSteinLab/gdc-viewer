/**
 * A Dialog for adding complex GDC tracks using a faceted search
 */
define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/layout/TabContainer',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
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
    CheckBox,
    TabContainer,
    AccordionContainer,
    ContentPane,
    Menu,
    MenuItem,
    ComboButton,
    BaseGDCDialog
) {
    return declare(BaseGDCDialog, {
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

        // Each filter obejct shows the current filters applied for a given type
        // Note: double underscore (__) is returned by the graphQL calls, though when applying
        // filters they must be converted to a period (.)
        caseFilters: {
            'primary_site': [],
            'project__project_id': [],
            'project__name': [],
            'disease_type': [],
            'demographic__gender': [],
            'project__program__name': [],
            'project__program__id': [],
            'diagnoses__vital_status': [],
            'demographic__race': [],
            'demographic__ethnicity': []
        },

        mutationFilters: {
            'consequence__transcript__annotation__vep_impact': [],
            'consequence__transcript__annotation__sift_impact': [],
            'consequence__transcript__annotation__polyphen_impact': [],
            'mutation_subtype': [],
            'occurrence__case__observation__variant_calling__variant_caller': [],
            'consequence__transcript__consequence_type': []
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

        /**
         * Create a DOM object containing GDC Explore interface
         * @return {object} DOM object
         */
        _dialogContent: function () {
            var thisB = this;

            // Container holds all results in the dialog
            var dialogContainer = dom.create('div', { className: 'dialog-container', style: { width: '1200px', height: '700px' } });

            // Create the header section
            thisB.createHeaderSection(dialogContainer);

            // Create the scaffolding to hold everything
            thisB.createScaffolding(dialogContainer);

            // Creates facets and search results based on current filters
            thisB.refreshContent();
            thisB.resize();

            return dialogContainer;
        },

        /**
         * Add a header section with a title
         * @param {object} container DOM object to place header
         */
        createHeaderSection: function(container) {
            var thisB = this;

            var headerSection = dom.create('div', { style: "display: flex; flex-direction: row; justify-content: flex-start; align-items: center;" }, container);
            var logoSection = dom.create('div', { style: "flex-grow: 3" }, headerSection);

            var titleSection = dom.create('div', { style: "flex-grow: 5" }, headerSection);
            var aboutMessage = dom.create('h1', { innerHTML: "Explore data available on the GDC Data Portal" }, titleSection);
        },

        /**
         * Creates the scaffolding to place all of the accordions and search results in
         * @param {object} dialogContainer Location to place the scaffolding in
         */
        createScaffolding: function (dialogContainer) {
            var thisB = this;

            // Create main holder
            thisB.facetAndResultsHolder = dom.create('div', { className: 'flexHolder', style: { width: '100%', height: '100%', 'justify-content': 'space-between' } }, dialogContainer);
            
            // Create sections to hold facet tabs and search results tab
            thisB.facetTabHolder = dom.create('div', { style: { 'flex': '1 0 0'} }, thisB.facetAndResultsHolder);
            thisB.searchResultsVerticalHolder = dom.create('div', { style: { 'flex': '3 0 0' } }, thisB.facetAndResultsHolder);

            // Create facet tabs
            thisB.facetTabs = new TabContainer({style: "flex: 1 0 0; padding-right: 3px; padding-top: 5px;"}, thisB.facetTabHolder);

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
         * Updates the facets and search results with all current filters
         */
        refreshContent: function() {
            var thisB = this;
            // Create facets
            thisB.initializeFacets();

            // Update search results
            thisB.updateSSMSearchResults();
            thisB.updateGeneSearchResults();
            thisB.updateCaseSearchResults();
        },

        /**
         * Create facets based on currently selected filters
         */
        initializeFacets: function() {
            var thisB = this;
            
            // Create combined facet object
            var combinedFilters = thisB.combineAllFilters();
            combinedFilters = combinedFilters ? JSON.parse(combinedFilters) : combinedFilters

            var facetQuery = `query Queries($filters:FiltersArgument!,$first:Int!,$offset:Int!) {viewer {...F4}} fragment F0 on ECaseAggregations {primary_site {buckets {doc_count,key}},project__program__name {buckets {doc_count,key}},project__project_id {buckets {doc_count,key}},disease_type {buckets {doc_count,key}},demographic__gender {buckets {doc_count,key}},diagnoses__age_at_diagnosis {stats {max,min,count}},demographic__race {buckets {doc_count,key}},demographic__ethnicity {buckets {doc_count,key}}} fragment F1 on GeneAggregations {biotype {buckets {doc_count,key}},case__cnv__cnv_change {buckets {doc_count,key,key_as_string}},is_cancer_gene_census {buckets {doc_count,key,key_as_string}}} fragment F2 on CNVAggregations {cnv_change {buckets {doc_count,key,key_as_string}}} fragment F3 on SsmAggregations {consequence__transcript__annotation__vep_impact {buckets {doc_count,key}},consequence__transcript__annotation__polyphen_impact {buckets {doc_count,key}},consequence__transcript__annotation__sift_impact {buckets {doc_count,key}},consequence__transcript__consequence_type {buckets {doc_count,key}},mutation_subtype {buckets {doc_count,key}},occurrence__case__observation__variant_calling__variant_caller {buckets {doc_count,key}}} fragment F4 on Root {explore {cases {_aggregations:aggregations(filters:$filters,aggregations_filter_themselves:false) {...F0},_hits:hits(first:$first,offset:$offset,filters:$filters,score:"gene.gene_id") {total}},genes {_aggregations:aggregations(filters:$filters,aggregations_filter_themselves:false) {...F1},_hits:hits(filters:$filters) {total}},cnvs {_aggregations:aggregations(filters:$filters,aggregations_filter_themselves:false) {...F2},_hits:hits(filters:$filters) {total}},ssms {_aggregations:aggregations(filters:$filters,aggregations_filter_themselves:false) {...F3},_hits:hits(filters:$filters) {total}}}}`;
            var bodyVal = {
                query: facetQuery,
                variables: {
                    "filters": combinedFilters,
                    "first": 20,
                    "offset": 0
                  }
            }

            // Create stubs for the accordions for the facets
            thisB.createAccordionStubs();

            // Clear and readd loading icons to each of the stubbed accordions
            dom.empty(thisB.caseFacetTab.containerNode);
            dom.empty(thisB.mutationFacetTab.containerNode);
            dom.empty(thisB.geneFacetTab.containerNode);
            var caseLoading = thisB.createLoadingIcon(thisB.caseFacetTab.containerNode);
            var mutationLoading = thisB.createLoadingIcon(thisB.mutationFacetTab.containerNode);
            var geneLoading = thisB.createLoadingIcon(thisB.geneFacetTab.containerNode);

            // Update the accordions with results from the GDC
            fetch(thisB.baseGraphQLUrl, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: JSON.stringify(bodyVal)
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                dom.empty(caseLoading);
                dom.empty(mutationLoading);
                dom.empty(geneLoading);
                thisB.updateAccordions(response);
            }).catch(function(err) {
                console.log(err);
            });
        },

        /**
         * Create stub accordion holders
         */
        createAccordionStubs() {
            var thisB = this;
            thisB.caseAccordion = new AccordionContainer({ id: 'accordion_case_' + thisB.guid(), className: "accordionContainer", style: "overflow: scroll" }, thisB.caseFacetTab.containerNode);
            thisB.mutationAccordion = new AccordionContainer({ id: 'accordion_ssm_' + thisB.guid(), className: "accordionContainer", style: "overflow: scroll" }, thisB.mutationFacetTab.containerNode);
            thisB.geneAccordion = new AccordionContainer({ id: 'accordion_gene_' + thisB.guid(), className: "accordionContainer", style: "overflow: scroll" }, thisB.geneFacetTab.containerNode);
        },

        /**
         * Updates accordions based on the response from GDC
         * @param {object} response response from GraphQL GDC call
         */
        updateAccordions(response) {
            var thisB = this;
            if (response && response.data && response.data.viewer && response.data.viewer.explore) {
                thisB.createFacet('case', thisB.caseAccordion, response.data.viewer.explore.cases);
                thisB.createFacet('ssm', thisB.mutationAccordion, response.data.viewer.explore.ssms);
                thisB.createFacet('gene', thisB.geneAccordion, response.data.viewer.explore.genes);
            } else {
                thisB.setErrorMessage(thisB.caseAccordion.containerNode);
                thisB.setErrorMessage(thisB.mutationAccordion.containerNode);
                thisB.setErrorMessage(thisB.geneAccordion.containerNode);
            }
        },

        /**
         * Adds an error message at the given location, along with a button to do a hard reset
         * @param {object} location 
         */
        setErrorMessage(location) {
            var thisB = this;
            var errorMessageHolder = dom.create('div', { style: 'display: flex; flex-direction: column; align-items: center;' }, location);
            var errorMessage = dom.create('div', { innerHTML: 'There was an error contacting GDC.' }, errorMessageHolder);
            var hardRefreshButton = new Button({
                label: 'Refresh Results',
                onClick: function() {
                    thisB.destroyAccordions();
                    thisB.refreshContent();
                }
            }).placeAt(errorMessageHolder);
            thisB.addTooltipToButton(hardRefreshButton, "Manually refresh all content based on current filters");
        },

        /**
         * Creates a facet of the given type and adds it to the corresponding accordion.
         * Uses results from GDC GraphQL.
         * @param {string} type case, ssm, or gene
         * @param {object} accordion accordion to place facets in
         * @param {object} results response from GraphQL GDC call
         */
        createFacet(type, accordion, results) {
            var thisB = this;
            // Add a content pane per facet group
            for (var facet in results._aggregations) {
                // Ignore some of the facets
                if (!["diagnoses__age_at_diagnosis", "diagnoses__days_to_death", "case__cnv__cnv_change"].includes(facet)) {
                    var contentPane = new ContentPane({
                        title: thisB.prettyFacetName(facet),
                        style: "height: auto;",
                        id: facet + '-' + type + '-' + thisB.guid()
                    });

                    var facetHolder = dom.create('span', { className: "flex-column" });

                    if (results._aggregations[facet].buckets && results._aggregations[facet].buckets.length > 0) {
                        // Alphabetical sort
                        results._aggregations[facet].buckets.sort(thisB.compareTermElements);

                        // Add a checkbox per facet option
                        results._aggregations[facet].buckets.forEach((term) => {
                            var facetCheckbox = dom.create('span', { className: "flex-row" }, facetHolder)

                            var checkBox = new CheckBox({
                                name: facet + '-' + term.key,
                                id: facet + '-' + term.key + '-' + type + '-' + thisB.guid(),
                                value: { "facet": facet, "term" : term.key, "type": type },
                                checked: thisB.isChecked(facet, term.key, thisB.getFiltersForType(type)),
                                onChange: function(isChecked) {
                                    if (isChecked) {
                                        if (this.value.type === 'case') {
                                            thisB.caseFilters[this.value.facet].push(this.value.term);
                                        } else if (this.value.type === 'ssm') {
                                            thisB.mutationFilters[this.value.facet].push(this.value.term);
                                        } else if (this.value.type === 'gene') {
                                            thisB.geneFilters[this.value.facet].push(this.value.term);
                                        }
                                    } else {
                                        if (this.value.type === 'case') {
                                            var indexOfValue = thisB.caseFilters[this.value.facet].indexOf(this.value.term);
                                            if (indexOfValue != -1) {
                                                thisB.caseFilters[this.value.facet].splice(indexOfValue, 1);
                                            }
                                        } else if (this.value.type === 'ssm') {
                                            var indexOfValue = thisB.mutationFilters[this.value.facet].indexOf(this.value.term);
                                            if (indexOfValue != -1) {
                                                thisB.mutationFilters[this.value.facet].splice(indexOfValue, 1);
                                            }
                                        } else if (this.value.type === 'gene') {
                                            var indexOfValue = thisB.geneFilters[this.value.facet].indexOf(this.value.term);
                                            if (indexOfValue != -1) {
                                                thisB.geneFilters[this.value.facet].splice(indexOfValue, 1);
                                            }
                                        }
                                    }
                                    thisB.destroyAccordions();
                                    thisB.refreshContent();
                                }
                            }, 'checkbox').placeAt(facetCheckbox);
                            var label = dom.create("label", { "for" : facet + '-' + term.key + '-' + type + '-' + thisB.guid(), innerHTML: term.key + ' (' + (term.doc_count).toLocaleString() + ')' }, facetCheckbox);
                        });
                    }

                    dojo.place(facetHolder, contentPane.containerNode);
                    accordion.addChild(contentPane);
                    contentPane.startup();
                }
            }

            accordion.startup();
            accordion.resize();
            thisB.resize();
        },

        /**
         * Compare function used for sorting facets
         * @param {object} a 
         * @param {object} b 
         * @return {number}
         */
        compareTermElements: function(a, b) {
            if (a.key < b.key)
                return -1;
            if (a.key > b.key)
                return 1;
            return 0;
        },

        /**
         * Updates the SSM search results page
         */
        updateSSMSearchResults: function() {
            var thisB = this;
            var url = thisB.baseGraphQLUrl + '/SsmsTable';

            // Clear existing pretty filters
            dom.empty(thisB.prettyFacetHolder);

            // Display currently selected filters
            thisB.prettyPrintFilters(thisB.prettyFacetHolder);

            // Clear current results
            dom.empty(thisB.mutationResultsTab.containerNode);
            thisB.createLoadingIcon(thisB.mutationResultsTab.containerNode);

            // Create body for GraphQL query
            var start = thisB.getStartIndex(thisB.mutationPage);
            var size = thisB.pageSize;
            var ssmQuery = `query ssmResultsTableQuery( $ssmTypeFilter: FiltersArgument $ssmCaseFilters: FiltersArgument $ssmSize: Int $ssmConsequenceFilters: FiltersArgument $ssmOffset: Int $ssmFilters: FiltersArgument $score: String $sort: [Sort] ) { viewer { explore { cases { hits(first: 0, filters: $ssmTypeFilter) { total } } filteredCases: cases { hits(first: 0, filters: $ssmCaseFilters) { total } } ssms { hits(first: $ssmSize, offset: $ssmOffset, filters: $ssmFilters, score: $score, sort: $sort) { total edges { node { id score genomic_dna_change mutation_subtype ssm_id consequence { hits(first: 1, filters: $ssmConsequenceFilters) { edges { node { transcript { is_canonical annotation { vep_impact polyphen_impact polyphen_score sift_score sift_impact } consequence_type gene { gene_id symbol } aa_change } id } } } } filteredOccurences: occurrence { hits(first: 0, filters: $ssmCaseFilters) { total } } occurrence { hits(first: 0, filters: $ssmTypeFilter) { total } } } } } } } } }`;
            var caseFilter = {"op":"and","content":[{"op":"in","content":{"field":"available_variation_data","value":["ssm"]}}]}

            var combinedFilters = thisB.combineAllFilters();
            if (combinedFilters) {
                combinedFilters = JSON.parse(combinedFilters);
                caseFilter.content.push(combinedFilters);
            }

            var bodyVal = {
                query: ssmQuery,
                variables: {
                    "ssmTypeFilter":{"op":"and","content":[{"op":"in","content":{"field":"cases.available_variation_data","value":["ssm"]}}]},
                    "ssmCaseFilters": caseFilter,
                    "ssmSize": parseInt(size),
                    "ssmConsequenceFilters":{"op":"and","content":[{"op":"in","content":{"field":"consequence.transcript.is_canonical","value":["true"]}}]},
                    "ssmOffset": parseInt(start),
                    "ssmFilters": combinedFilters,
                    "score":"occurrence.case.project.project_id",
                    "sort":[{"field":"_score","order":"desc"},{"field":"_uid","order":"asc"}]
                }
            }

            fetch(url, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: JSON.stringify(bodyVal)
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                var combinedFilters = thisB.combineAllFilters();
                if (combinedFilters) {
                    combinedFilters = JSON.parse(combinedFilters);
                }
                dom.empty(thisB.mutationResultsTab.containerNode);

                // Buttons for SSMs
                var ssmMenu = new Menu({ style: "display: none;"});
                var menuItemSSMFiltered = new MenuItem({
                    label: "Filtered SSMs form GDC",
                    iconClass: "dijitIconNewTask",
                    onClick: function() {
                        thisB.addTrack('SimpleSomaticMutations', undefined, combinedFilters, 'CanvasVariants');
                        alert("Adding track with all SSMs from the GDC, with current filters applied");
                    }
                });
                ssmMenu.addChild(menuItemSSMFiltered);
                ssmMenu.startup();

                var buttonAllSSMs = new ComboButton({
                    label: "All SSMs from GDC",
                    iconClass: "dijitIconNewTask",
                    dropDown: ssmMenu,
                    onClick: function() {
                        thisB.addTrack('SimpleSomaticMutations', undefined, undefined, 'CanvasVariants');
                        alert("Add track with all SSMs from the GDC");
                    }
                });
                buttonAllSSMs.placeAt(thisB.mutationResultsTab.containerNode);
                buttonAllSSMs.startup();
                thisB.addTooltipToButton(menuItemSSMFiltered, "Add track with all SSMs from the GDC, with current filters applied");
                thisB.addTooltipToButton(buttonAllSSMs, "Add track with all SSMs from the GDC");

                var totalSSMs = response.data.viewer.explore.ssms.hits.total;
                var startResultCount = ((thisB.mutationPage - 1) * thisB.pageSize);
                if (totalSSMs > 0) {
                    startResultCount += 1;
                }
                var endResultCount = thisB.mutationPage * thisB.pageSize <= totalSSMs ? thisB.mutationPage * thisB.pageSize : totalSSMs;

                var resultsInfo = dom.create('div', { innerHTML: "Showing " + startResultCount.toLocaleString() + " to " + endResultCount.toLocaleString() + " of " + totalSSMs.toLocaleString() }, thisB.mutationResultsTab.containerNode);
                thisB.createMutationsTable(response, thisB.mutationResultsTab.containerNode);
                thisB.createPaginationButtons(thisB.mutationResultsTab.containerNode, totalSSMs / thisB.pageSize, 'ssm', thisB.mutationPage);
            }).catch(function(err) {
                console.log(err);
                thisB.setErrorMessage(thisB.mutationAccordion.containerNode);
            });
        },

        /**
         * Updates the Gene search results page
         */
        updateGeneSearchResults: function() {
            var thisB = this;
            var url = thisB.baseGraphQLUrl + '/GenesTable';

            // Clear existing pretty filters
            dom.empty(thisB.prettyFacetHolder);

            // Display currently selected filters
            thisB.prettyPrintFilters(thisB.prettyFacetHolder);

            // Clear current results
            dom.empty(thisB.geneResultsTab.containerNode);
            thisB.createLoadingIcon(thisB.geneResultsTab.containerNode);

            // Create body for GraphQL query
            var start = thisB.getStartIndex(thisB.genePage);
            var size = thisB.pageSize;
            var geneQuery = `query geneResultsTableQuery( $genesFilters: FiltersArgument $geneSize: Int $geneOffset: Int $score: String $ssmCase: FiltersArgument $geneCaseFilter: FiltersArgument $ssmTypeFilter: FiltersArgument $cnvTypeFilter: FiltersArgument $cnvGainFilters: FiltersArgument $cnvLossFilters: FiltersArgument ) { genesTableViewer: viewer { explore { cases { hits(first: 0, filters: $ssmTypeFilter) { total } } filteredCases: cases { hits(first: 0, filters: $geneCaseFilter) { total } } cnvCases: cases { hits(first: 0, filters: $cnvTypeFilter) { total } } genes { hits(first: $geneSize, offset: $geneOffset, filters: $genesFilters, score: $score) { total edges { node { gene_id id symbol name cytoband biotype numCases: score is_cancer_gene_census ssm_case: case { hits(first: 0, filters: $ssmCase) { total } } cnv_case: case { hits(first: 0, filters: $cnvTypeFilter) { total } } case_cnv_gain: case { hits(first: 0, filters: $cnvGainFilters) { total } } case_cnv_loss: case { hits(first: 0, filters: $cnvLossFilters) { total } } } } } } } } }`;

            var geneFilter = {"op":"and","content":[{"op":"in","content":{"field":"available_variation_data","value":["ssm"]}}]}
            var cnvTypeFilter = {"op":"and","content":[{"op":"in","content":{"field":"available_variation_data","value":["cnv"]}}]}
            var cnvGainFilter = {"op":"and","content":[{"op":"in","content":{"field":"available_variation_data","value":["cnv"]}}]}
            var cnvLossFilter = {"op":"and","content":[{"op":"in","content":{"field":"available_variation_data","value":["cnv"]}}]}

            var combinedFilters = thisB.combineAllFilters();
            if (combinedFilters) {
                combinedFilters = JSON.parse(combinedFilters);
                geneFilter.content.push(combinedFilters);
                cnvTypeFilter.content.push(combinedFilters);
                cnvLossFilter.content.push(combinedFilters);
                cnvGainFilter.content.push(combinedFilters);
            }

            cnvLossFilter.content.push({op: "in", content: {field: "cnvs.cnv_change", value: ["Loss"]}});
            cnvGainFilter.content.push({op: "in", content: {field: "cnvs.cnv_change", value: ["Gain"]}});

            var bodyVal = {
                query: geneQuery,
                variables: {
                    "cnvGainFilters": cnvGainFilter,
                    "cnvLossFilters": cnvLossFilter,
                    "cnvTypeFilter": cnvTypeFilter,
                    "geneCaseFilter": geneFilter,
                    "genesFilters": combinedFilters,
                    "geneSize": parseInt(size),
                    "geneOffset": parseInt(start),
                    "score": "case.project.project_id",
                    "ssmCase": {op: "and", content: [{op: "in", content: {field: "cases.available_variation_data", value: ["ssm"]}}, {op: "NOT", content: {field: "genes.case.ssm.observation.observation_id", value: "MISSING"}}]},
                    "ssmTypeFilter": {op: "and", content: [{op: "in", content: {field: "cases.available_variation_data", value: ["ssm"]}}]}
                }
            }

            fetch(url, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: JSON.stringify(bodyVal)
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                dom.empty(thisB.geneResultsTab.containerNode);
                var combinedFilters = thisB.combineAllFilters();
                if (combinedFilters) {
                    combinedFilters = JSON.parse(combinedFilters);
                }

                // Buttons for Genes
                var geneMenu = new Menu({ style: "display: none;"});
                var menuItemGeneFiltered = new MenuItem({
                    label: "Filtered Genes from GDC",
                    iconClass: "dijitIconNewTask",
                    onClick: function() {
                        thisB.addTrack('Genes', undefined, combinedFilters, 'CanvasVariants');
                        alert("Adding track with all genes from the GDC, with current filters applied");
                    }
                });
                geneMenu.addChild(menuItemGeneFiltered);
                geneMenu.startup();

                var buttonAllGenes = new ComboButton({
                    label: "All Genes from GDC",
                    iconClass: "dijitIconNewTask",
                    dropDown: geneMenu,
                    style: "padding-right: 8px;",
                    onClick: function() {
                        thisB.addTrack('Genes', undefined, undefined, 'CanvasVariants');
                        alert("Adding track with all genes from the GDC");
                    }
                });
                buttonAllGenes.placeAt(thisB.geneResultsTab.containerNode);
                buttonAllGenes.startup();
                thisB.addTooltipToButton(menuItemGeneFiltered, "Add track with all genes from the GDC, with current filters applied");
                thisB.addTooltipToButton(buttonAllGenes, "Add track with all genes from the GDC");

                // Buttons for CNVs
                var cnvMenu = new Menu({ style: "display: none;"});
                var menuItemCnvFiltered = new MenuItem({
                    label: "Filtered CNVs from GDC",
                    iconClass: "dijitIconNewTask",
                    onClick: function() {
                        thisB.addTrack('CNVs', undefined, combinedFilters, 'Wiggle/XYPlot');
                        alert("Adding track with all CNVs from the GDC, with current filters applied");
                    }
                });
                cnvMenu.addChild(menuItemCnvFiltered);
                cnvMenu.startup();

                var buttonAllCnvs = new ComboButton({
                    label: "All CNVs from GDC",
                    iconClass: "dijitIconNewTask",
                    dropDown: cnvMenu,
                    onClick: function() {
                        thisB.addTrack('CNVs', undefined, undefined, 'Wiggle/XYPlot');
                        alert("Adding track with all CNVs from the GDC");
                    }
                });
                buttonAllCnvs.placeAt(thisB.geneResultsTab.containerNode);
                buttonAllCnvs.startup();
                thisB.addTooltipToButton(menuItemCnvFiltered, "Add track with all CNVs from the GDC, with current filters applied");
                thisB.addTooltipToButton(buttonAllCnvs, "Add track with all CNVs from the GDC");

                var totalGenes = response.data.genesTableViewer.explore.genes.hits.total;
                var startResultCount = ((thisB.genePage - 1) * thisB.pageSize);
                if (totalGenes > 0) {
                    startResultCount += 1;
                }
                var endResultCount = thisB.genePage * thisB.pageSize <= totalGenes ? thisB.genePage * thisB.pageSize : totalGenes;

                var resultsInfo = dom.create('div', { innerHTML: "Showing " + startResultCount.toLocaleString() + " to " + endResultCount.toLocaleString() + " of " + totalGenes.toLocaleString() }, thisB.geneResultsTab.containerNode);
                thisB.createGenesTable(response, thisB.geneResultsTab.containerNode);
                thisB.createPaginationButtons(thisB.geneResultsTab.containerNode, totalGenes / thisB.pageSize, 'gene', thisB.genePage);
            }).catch(function(err) {
                console.log(err);
                thisB.setErrorMessage(thisB.geneAccordion.containerNode);
            });
        },

        /**
         * Updates the Case search results page
         */
        updateCaseSearchResults: function() {
            var thisB = this;
            var url = thisB.baseGraphQLUrl + '/ExploreCasesTable';

            // Clear existing pretty filters
            dom.empty(thisB.prettyFacetHolder);

            // Display currently selected filters
            thisB.prettyPrintFilters(thisB.prettyFacetHolder);

            // Clear current results
            dom.empty(thisB.caseResultsTab.containerNode);
            thisB.createLoadingIcon(thisB.caseResultsTab.containerNode);

            // Create body for GraphQL query
            var start = thisB.getStartIndex(thisB.casePage);
            var size = thisB.pageSize;
            var caseQuery = `query caseResultsTableQuery( $filters: FiltersArgument $casesSize: Int $casesOffset: Int $casesScore: String $sort: [Sort] ) { exploreCasesTableViewer: viewer { explore { cases { hits(first: $casesSize, offset: $casesOffset, filters: $filters, score: $casesScore, sort: $sort) { total edges { node { score id case_id primary_site disease_type submitter_id project { project_id program { name } id } diagnoses { hits(first: 1) { edges { node { primary_diagnosis age_at_diagnosis id } } } } demographic { gender ethnicity race } summary { data_categories { file_count data_category } experimental_strategies { experimental_strategy file_count } file_count } } } } } } } }`;

            var combinedFilters = thisB.combineAllFilters();
            if (combinedFilters) {
                combinedFilters = JSON.parse(combinedFilters);
            }

            var bodyVal = {
                query: caseQuery,
                variables: {
                    "filters": combinedFilters,
                    "casesSize": parseInt(size),
                    "casesOffset": parseInt(start),
                    "casesScore": "gene.gene_id",
                    "sort": null
                }
            }

            fetch(url, {
                method: 'post',
                headers: { 'X-Requested-With': null },
                body: JSON.stringify(bodyVal)
            }).then(function(response) {
                return(response.json());
            }).then(function(response) {
                dom.empty(thisB.caseResultsTab.containerNode);

                var totalCases = response.data.exploreCasesTableViewer.explore.cases.hits.total;
                var startResultCount = ((thisB.casePage - 1) * thisB.pageSize);
                if (totalCases > 0) {
                    startResultCount += 1;
                }
                var endResultCount = thisB.casePage * thisB.pageSize <= totalCases ? thisB.casePage * thisB.pageSize : totalCases;

                var resultsInfo = dom.create('div', { innerHTML: "Showing " + startResultCount.toLocaleString() + " to " + endResultCount.toLocaleString() + " of " + totalCases.toLocaleString() }, thisB.caseResultsTab.containerNode);
                thisB.createDonorsTable(response, thisB.caseResultsTab.containerNode);
                thisB.createPaginationButtons(thisB.caseResultsTab.containerNode, totalCases / thisB.pageSize, 'case', thisB.casePage);
            }).catch(function(err) {
                console.log(err);
                thisB.setErrorMessage(thisB.caseAccordion.containerNode);
            });
        },

        /**
         * Creates the cases table for the given hits in some location
         * @param {object} response the response from the GDC graphQL query
         * @param {object} location dom element to place the table
         */
        createDonorsTable: function(response, location) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Case ID</th>
                    <th>Project</th>
                    <th>Primary Site</th>
                    <th>Gender</th>
                    <th>Genes</th>
                    <th>SSMs</th>
                    <th>CNVs</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            var hasHits = false;
            if (response.data) {
                for (var hitId in response.data.exploreCasesTableViewer.explore.cases.hits.edges) {
                    hasHits = true;
                    var hit = response.data.exploreCasesTableViewer.explore.cases.hits.edges[hitId].node;

                    var caseRowContent = `
                            <td><a target="_blank"  href="https://portal.gdc.cancer.gov/cases/${hit.case_id}">${hit.submitter_id}</a></td>
                            <td><a target="_blank"  href="https://portal.gdc.cancer.gov/projects/${hit.project.project_id}">${hit.project.project_id}</td>
                            <td>${hit.primary_site}</td>
                            <td>${hit.demographic.gender}</td>
                    `
                    var caseRowContentNode = dom.toDom(caseRowContent);

                    // Create element to hold buttons
                    var geneButtonNode = dom.toDom(`<td></td>`);

                    // Create Filters for buttons
                    var combinedFilters = thisB.combineAllFilters();

                    if (combinedFilters) {
                        combinedFilters = JSON.parse(combinedFilters);
                    }

                    // Gene Buttons
                    var geneMenu = new Menu({ style: "display: none;"});
                    var menuItemGeneFiltered = new MenuItem({
                        label: "Filtered Genes for Donor",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit, combinedFilters) {
                            return function() {
                                thisB.addTrack('Genes', hit.case_id, combinedFilters, 'CanvasVariants');
                                alert("Adding Gene track for case " + hit.case_id);
                            }
                        })(hit, combinedFilters)
                    });
                    geneMenu.addChild(menuItemGeneFiltered);
                    geneMenu.startup();

                    var buttonAllGenes = new ComboButton({
                        label: "All Genes for Donor",
                        iconClass: "dijitIconNewTask",
                        dropDown: geneMenu,
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('Genes', hit.case_id, undefined, 'CanvasVariants');
                                alert("Adding Gene track for case " + hit.case_id);
                            }
                        })(hit)
                    });
                    buttonAllGenes.placeAt(geneButtonNode);
                    buttonAllGenes.startup();
                    thisB.addTooltipToButton(menuItemGeneFiltered, "Add track with all genes for the given donor, with current filters applied");
                    thisB.addTooltipToButton(buttonAllGenes, "Add track with all genes for the given donor");

                    // Place buttons in table
                    dom.place(geneButtonNode, caseRowContentNode);

                    // Create element to hold buttons
                    var ssmButtonNode = dom.toDom(`<td></td>`);

                    // SSM Buttons
                    var ssmMenu = new Menu({ style: "display: none;"});
                    var menuItemSsmFiltered = new MenuItem({
                        label: "Filtered SSMs for Donor",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit, combinedFilters) {
                            return function() {
                                thisB.addTrack('SimpleSomaticMutations',  hit.case_id, combinedFilters, 'CanvasVariants');
                                alert("Adding Simple Somatic Mutation track for case " +  hit.case_id);
                            }
                        })(hit, combinedFilters)
                    });
                    ssmMenu.addChild(menuItemSsmFiltered);
                    ssmMenu.startup();

                    var buttonAllSsms = new ComboButton({
                        label: "All SSMs for Donor",
                        iconClass: "dijitIconNewTask",
                        dropDown: ssmMenu,
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('SimpleSomaticMutations',  hit.case_id, undefined, 'CanvasVariants');
                                alert("Adding Simple Somatic Mutation track for case " +  hit.case_id);
                            }
                        })(hit)
                    });
                    buttonAllSsms.placeAt(ssmButtonNode);
                    buttonAllSsms.startup();
                    thisB.addTooltipToButton(menuItemSsmFiltered, "Add track with all SSMs for the given donor, with current filters applied");
                    thisB.addTooltipToButton(buttonAllSsms, "Add track with all SSMS for the given donor");

                    // Place buttons in table
                    dom.place(ssmButtonNode, caseRowContentNode);

                    // Create element to hold buttons
                    var cnvButtonNode = dom.toDom(`<td></td>`);

                    // CNV Buttons
                    var cnvMenu = new Menu({ style: "display: none;"});
                    var menuItemCnvFiltered = new MenuItem({
                        label: "Filtered CNVs for Donor",
                        iconClass: "dijitIconNewTask",
                        onClick: (function(hit, combinedFilters) {
                            return function() {
                                thisB.addTrack('CNVs',  hit.case_id, combinedFilters, 'Wiggle/XYPlot');
                                alert("Adding CNV track for case " +  hit.case_id);
                            }
                        })(hit, combinedFilters)
                    });
                    cnvMenu.addChild(menuItemCnvFiltered);
                    cnvMenu.startup();

                    var buttonAllCnvs = new ComboButton({
                        label: "All CNVs for Donor",
                        iconClass: "dijitIconNewTask",
                        dropDown: cnvMenu,
                        onClick: (function(hit) {
                            return function() {
                                thisB.addTrack('CNVs',  hit.case_id, undefined, 'Wiggle/XYPlot');
                                alert("Adding CNV track for case " +  hit.case_id);
                            }
                        })(hit)
                    });
                    buttonAllCnvs.placeAt(cnvButtonNode);
                    buttonAllCnvs.startup();
                    thisB.addTooltipToButton(menuItemCnvFiltered, "Add track with all CNVs for the given donor, with current filters applied");
                    thisB.addTooltipToButton(buttonAllCnvs, "Add track with all CNVs for the given donor");

                    // Place buttons in table
                    dom.place(cnvButtonNode, caseRowContentNode);

                    // Place columns into row
                    var row = `<tr></tr>`;
                    var rowNodeHolder = dom.toDom(row);
                    dom.place(caseRowContentNode, rowNodeHolder);
                    dom.place(rowNodeHolder, rowsHolderNode);

                }
            }

            if (!hasHits) {
                var noResultsHtml = `
                    <tr>
                        <td colspan="7" style="text-align: center;">No cases found</td>
                    </tr>
                `;

                var noResultsRow = dom.toDom(noResultsHtml);
                dom.place(noResultsRow, rowsHolderNode);
            }

            // Place rows into table
            dom.place(rowsHolderNode, tableNode);

            // Place table into dialog
            dom.place(tableNode, location);
        },

        /**
         * Creates the genes table for the given hits in some location
         * @param {object} response the response from the GDC graphQL query
         * @param {object} location dom element to place the table
         */
        createGenesTable: function(response, location) {
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th># SSM Affected Cases in Cohort</th>
                    <th># SSM Affected Cases Across the GDC</th>
                    <th># CNV Gain</th>
                    <th># CNV Loss</th>
                    <th>Is Cancer Gene Census</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);

            var hasHits = false;

            if (response.data) {
                for (var hitId in response.data.genesTableViewer.explore.genes.hits.edges) {
                    hasHits = true;
                    var hit = response.data.genesTableViewer.explore.genes.hits.edges[hitId].node;

                    var caseRowContent = `
                            <td><a target="_blank" href="https://portal.gdc.cancer.gov/genes/${hit.gene_id}">${hit.symbol}</a></td>
                            <td>${hit.name}</td>
                            <td>${(hit.ssm_case.hits.total).toLocaleString()} / ${(response.data.genesTableViewer.explore.cases.hits.total).toLocaleString()}</td>
                            <td>${(hit.ssm_case.hits.total).toLocaleString()} / ${(response.data.genesTableViewer.explore.filteredCases.hits.total).toLocaleString()}</td>
                            <td>${(hit.case_cnv_gain.hits.total).toLocaleString()} / ${(response.data.genesTableViewer.explore.cnvCases.hits.total).toLocaleString()}</td>
                            <td>${(hit.case_cnv_loss.hits.total).toLocaleString()} / ${(response.data.genesTableViewer.explore.cnvCases.hits.total).toLocaleString()}</td>
                            <td>${hit.is_cancer_gene_census ? 'Yes' : 'No' }</td>
                    `
                    var caseRowContentNode = dom.toDom(caseRowContent);

                    var row = `<tr></tr>`;
                    var rowNodeHolder = dom.toDom(row);
                    dom.place(caseRowContentNode, rowNodeHolder);
                    dom.place(rowNodeHolder, rowsHolderNode);

                }
            }

            if (!hasHits) {
                var noResultsHtml = `
                    <tr>
                        <td colspan="7" style="text-align: center;">No genes found</td>
                    </tr>
                `;

                var noResultsRow = dom.toDom(noResultsHtml);
                dom.place(noResultsRow, rowsHolderNode);
            }
            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        /**
         * Returns HTML for consequences of a mutation
         * @param {List<object>} consequences list of consequence objects
         */
        getMutationConsequences: function(consequences) {
            var result = '';
            for (var hitId in consequences) {
                var consequenceSpan = '<span>';
                var hit = consequences[hitId];
                var consequence = hit.node.transcript.consequence_type;
                var aa_change = hit.node.transcript.aa_change;
                var geneSymbol = hit.node.transcript.gene.symbol;
                var geneId = hit.node.transcript.gene.gene_id;
                consequenceSpan += consequence + ' ' + `<a href='https://portal.gdc.cancer.gov/genes/` +  geneId + `'>` + geneSymbol + '</a>';
                if (aa_change) {
                    consequenceSpan += ' ' + aa_change;
                }
                consequenceSpan += '</span>';
                result += consequenceSpan;
            }
            return result;
        },

        /**
         * Returns HTML for impact of a mutation
         * @param {List<object} consequences list of consequence objects
         */
        getMutationImpact: function(consequences) {
            var result = '';
            for (var hitId in consequences) {
                var impactSpan = '<span>';
                var hit = consequences[hitId];
                var polyphen_impact = hit.node.transcript.annotation.polyphen_impact;
                var polyphen_score = hit.node.transcript.annotation.polyphen_score;
                var sift_impact = hit.node.transcript.annotation.sift_impact;
                var sift_score = hit.node.transcript.annotation.sift_score;
                var vep_impact = hit.node.transcript.annotation.vep_impact;
                if (vep_impact) {
                    impactSpan += 'VEP: ' + vep_impact;
                }
                if (polyphen_score) {
                    if (vep_impact) {
                        impactSpan += '<br/>';
                    }
                    impactSpan += 'Polyphen: ' + polyphen_impact + ' (' + polyphen_score + ')'
                }
                if (sift_score) {
                    if (vep_impact || sift_score) {
                        impactSpan += '<br/>';
                    }
                    impactSpan += 'SIFT: ' + sift_impact + ' (' + sift_score + ')';
                }
                result += impactSpan;
            }
            return result;
        },

        /**
         * Creates the mutations table for the given hits in some location
         * @param {object} response response from the GDC graphql
         * @param {object} location dom element to place the table
         */
        createMutationsTable: function(response, location) {
            var thisB = this;
            var table = `<table class="results-table"></table>`;
            var tableNode = dom.toDom(table);
            var rowsHolder = `
                <tr>
                    <th>DNA Change</th>
                    <th>Type</th>
                    <th>Consequences</th>
                    <th># Affected Cases in Cohort</th>
                    <th># Affected Cases Across the GDC</th>
                    <th>Impact</th>
                </tr>
            `;

            var rowsHolderNode = dom.toDom(rowsHolder);
            var hasHits = false;
            if (response.data) {
                for (var hitId in response.data.viewer.explore.ssms.hits.edges) {
                    hasHits = true;
                    var hit = response.data.viewer.explore.ssms.hits.edges[hitId];

                    var caseRowContent = `
                            <td><a target="_blank"  href="https://portal.gdc.cancer.gov/ssms/${hit.node.ssm_id}">${hit.node.genomic_dna_change}</a></td>
                            <td>${hit.node.mutation_subtype}</td>
                            <td>${thisB.getMutationConsequences(hit.node.consequence.hits.edges)}</td>
                            <td>${(hit.node.filteredOccurences.hits.total).toLocaleString()} / ${(response.data.viewer.explore.filteredCases.hits.total).toLocaleString()}</td>
                            <td>${(hit.node.occurrence.hits.total).toLocaleString()} / ${(response.data.viewer.explore.cases.hits.total).toLocaleString()}</td>
                            <td>${thisB.getMutationImpact(hit.node.consequence.hits.edges)}</td>
                    `
                    var caseRowContentNode = dom.toDom(caseRowContent);

                    var row = `<tr></tr>`;
                    var rowNodeHolder = dom.toDom(row);
                    dom.place(caseRowContentNode, rowNodeHolder);
                    dom.place(rowNodeHolder, rowsHolderNode);

                }
            }
            if (!hasHits) {
                var noResultsHtml = `
                    <tr>
                        <td colspan="6" style="text-align: center;">No mutations found</td>
                    </tr>
                `;

                var noResultsRow = dom.toDom(noResultsHtml);
                dom.place(noResultsRow, rowsHolderNode);
            }

            dom.place(rowsHolderNode, tableNode);
            dom.place(tableNode, location);
        },

        /**
         * Creates pagination buttons for search results in the given 'holder' using the 'pagination' object from the ICGC response
         * @param {object} holder DOM location to place pagination buttons
         * @param {number} totalPages the total number of pages for the given query results
         * @param {string} type the type of results to create pagination button for
         * @param {number} pageNum the current page
         */
        createPaginationButtons: function(holder, totalPages, type, pageNum) {
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

            if (pageNum < totalPages) {
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
                thisB.updateCaseSearchResults();
            } else if (type === 'ssm') {
                thisB.mutationPage = thisB.mutationPage - 1;
                thisB.updateSSMSearchResults();
            } else if (type === 'gene') {
                thisB.genePage = thisB.genePage - 1;
                thisB.updateGeneSearchResults();
            }
        },

        /**
         * Loads the facet results at the next page
         * @param {string} type Page type
         */
        nextPage: function(type) {
            var thisB = this;
            if (type === 'case') {
                thisB.casePage = thisB.casePage + 1;
                thisB.updateCaseSearchResults();
            } else if (type === 'ssm') {
                thisB.mutationPage = thisB.mutationPage + 1;
                thisB.updateSSMSearchResults();
            } else if (type === 'gene') {
                thisB.genePage = thisB.genePage + 1;
                thisB.updateGeneSearchResults();
            }
        },

        /**
         * Calculate the 'from' parameter for the URL call
         * @param {number} page current page
         * @return {number} start index
         */
        getStartIndex: function(page) {
            var thisB = this;
            return thisB.pageSize * (page - 1);
        },

        /**
         * Retrieves the filters of some type
         * @param {string} type The type of accordion
         * @return {object} selected filter object
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
         * @return {boolean} is the facet selected
         */
        isChecked: function(facet, term, filters) {
            return filters[facet] && filters[facet].indexOf(term) > -1;
        },

        /**
         * Reset the pagination for search results
         */
        resetPagination: function() {
            var thisB = this;
            thisB.casePage = 1;
            thisB.genePage = 1;
            thisB.mutationPage = 1;
        },

        /**
         * Destroys an accordion of the given type
         */
        destroyAccordions: function() {
            var thisB = this;
            thisB.caseAccordion.destroyDescendants();
            thisB.mutationAccordion.destroyDescendants();
            thisB.geneAccordion.destroyDescendants();
        },

        /**
         * Converts a filter object to one that can be passed to the GDC API
         * @param {object} filters the filter object to be converted to GDC style filters
         * @return {string} encoded GDC filter string 
         */
        convertFilterObjectToGDCFilter: function(filters) {
            var gdcFilters = {"op":"and","content":[]};
            
            for (var key in filters) {
                if (filters[key] != undefined && filters[key].length > 0) {
                    var filterOperation = {"op":"in","content":{"field": "","value": []}};
                    filterOperation.content.field = key
                    filterOperation.content.value = filters[key];
                    gdcFilters.content.push(filterOperation);
                }
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
         * @return {object} combined filter object
         */
        combineAllFilters: function() {
            var thisB = this;

            var caseFiltersCopy = {};
            Object.keys(thisB.caseFilters).forEach(filter => caseFiltersCopy['cases.' + filter.replace(/__/g, '.')] = thisB.caseFilters[filter]);

            var geneFiltersCopy = {};
            Object.keys(thisB.geneFilters).forEach(filter => geneFiltersCopy['genes.' + filter.replace(/__/g, '.')] = thisB.geneFilters[filter]);

            var mutationFiltersCopy = {};
            Object.keys(thisB.mutationFilters).forEach(filter => mutationFiltersCopy['ssms.' + filter.replace(/__/g, '.')] = thisB.mutationFilters[filter]);

            var combinedFilters = Object.assign({}, caseFiltersCopy, mutationFiltersCopy, geneFiltersCopy);
            return decodeURI(thisB.convertFilterObjectToGDCFilter(combinedFilters));
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
                thisB.addTooltipToButton(clearFacetButton, "Clear all filters");
            }

            var currentFilter = 0;
            var prettyFacetString = "";
            var filterCount = Object.keys(filteredCombinedFilters).length;

            for (var key in filteredCombinedFilters) {
                if (filteredCombinedFilters[key] != undefined && filteredCombinedFilters[key].length > 0) {
                    var facetString = `<span class="filterNameGDC">${thisB.prettyFacetName(key)}</span>`;
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
         * @param {string} facetName facet name to be altered
         * @return {string} pretty facet name
         */
        prettyFacetName: function (facetName) {
            var splitName = facetName.split('__')
            var name = splitName[splitName.length - 1];
            return name.replace(/_/g, ' ');
        },

        /**
         * Clears all of the facets
         */
        clearFacets: function() {
            var thisB = this;
            dom.empty(thisB.prettyFacetHolder);

            for (var key in thisB.caseFilters) {
                thisB.caseFilters[key] = []
            }
            for (var key in thisB.geneFilters) {
                thisB.geneFilters[key] = []
            }
            for (var key in thisB.mutationFilters) {
                thisB.mutationFilters[key] = []
            }

            thisB.resetPagination();
            thisB.destroyAccordions();
            thisB.refreshContent();
        },

        /**
         * Generic function for adding a track of some type and store class
         * @param {string} storeClass the JBrowse store class
         * @param {number} caseId unique case ID
         * @param {object} combinedFacetObject facet object with all three types combined
         * @param {string} trackType the JBrowse track type
         */
        addTrack: function (storeClass, caseId, combinedFacetObject, trackType) {
            if (combinedFacetObject !== undefined) {
                combinedFacetObject = combinedFacetObject === '' ? undefined : JSON.stringify(combinedFacetObject);
            }

            var storeConf = {
                browser: this.browser,
                refSeq: this.browser.refSeq,
                type: 'gdc-viewer/Store/SeqFeature/' + storeClass,
                case: caseId,
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
                    case: caseId
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
                trackConf.fmtDetailValue_projects = function(value) { return "<div id='projects-gdc-" + value +  "'>Loading...</div" };
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
                trackConf.fmtDetailValue_projects = function(value) { return "<div id='projects-gdc-" + value +  "'>Loading...</div" };
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
            this.set('title', 'GDC Browser');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }
    });
});