/**
 * Tests the explore dialog
 */
describe('Explore GDC', function() {
    before(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')

        cy
            .server()

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/GenesTable',
                response: 'fixture:ExploreGDC/GeneTrack.json'
              }).as('getGeneTrack')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/SsmsTable',
                response: 'fixture:ExploreGDC/SSMTrack.json'
            }).as('getMutationTrack')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/CNVsTable',
                response: 'fixture:ExploreGDC/CNVTrack.json'
            }).as('getCNVTrack')

        cy.wait(1000) // Wait for load
        openExploreDialog()
    })

    /**
     * Opens the explore dialog
     */
    var openExploreDialog = function () {
        cy.get('#dropdownbutton_gdc').type('{enter}')
        cy.contains('Exploration').click()
        cy.contains('Explore cases, genes and mutations').click()
    }

    /**
     * Selects a facet tab, an accordion in that tab, and an option in that accordion
     * @param {number} tabIndex tab index (0-2)
     * @param {number} accordionIndex accordionIndex(0-n)
     * @param {number} optionIndex optionIndex (0-m)
     */
    var selectFacetTab = function (tabIndex, accordionIndex, optionIndex) {
        cy.get('.dijitTabListWrapper').eq(0).within(() => {
            cy.get('.dijitTab').eq(tabIndex).click()
        })

        cy.get('.dijitTabContainerTopChildWrapper.dijitVisible').eq(0).within(() => {
            cy.get('.dijitAccordionTitle').eq(accordionIndex).click()
            cy.get('.dijitAccordionChildWrapper').eq(accordionIndex).within(() => {
                cy.get('.dijitCheckBox').eq(optionIndex).click()
            })
        })
    }

    /**
     * Close the popup window
     */
    var closePopup = function() {
        cy.contains('GDC Browser').parent().within(() => {
            cy.get('.dijitDialogCloseIcon').click()
        })
    }

    /**
     * Select a results tab
     * @param {number} tabIndex index of tab (0-2)
     */
    var selectResultsTab = function (tabIndex) {
        cy.get('.dijitTabListWrapper').eq(1).within(() => {
            cy.get('.dijitTab').eq(tabIndex).click()
        })
    }

    /**
     * Checks the tab container for the existance of the given text
     * @param {Array<String>} textValues array of text
     */
    var checkResultsTab = function (textValues) {
        cy.get('.dijitTabContainer').eq(1).within(() => {
            for (var text of textValues) {
                cy.contains(text)
            }
        })
    }

    /**
     * Checks that each results tab has the expected information
     * Assumes case tab is already selected
     * @param {*} caseArray array of strings to check for on case tab
     * @param {*} geneArray array of strings to check for on gene tab
     * @param {*} mutationArray array of strings to check for on mutation tab
     */
    var checkAllResultsTab = function(caseArray, geneArray, mutationArray) {
        cy.wait(3000) // wait a few seconds for results to load
        // Validate case results
        checkResultsTab(caseArray)

        // Validate gene results
        selectResultsTab(1)
        checkResultsTab(geneArray)

        // Validate mutation results
        selectResultsTab(2)
        checkResultsTab(mutationArray)
    }

    it('Should be able to explore and apply facets', function() {
        // Select ethnicity -> hispanic or latino
        cy.get('.dijitDialog').within(() => {
            cy.contains('Explore data available on the GDC Data Portal')
            selectFacetTab(0, 0, 2)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 3,134', 'TCGA-A5-A1OF', 'TCGA-AJ-A3EK'],
            ['Showing 1 to 20 of 21,361', 'TTN', 'TP53'],
            ['Showing 1 to 20 of 139,827', 'chr7:g.140753336A>T', 'chr2:g.208248388C>T']
        )

        // Select is cancer gene census - 1
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(1, 1, 0)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 509', 'TCGA-A5-A1OF', 'TCGA-AJ-A3EK'],
            ['Showing 1 to 20 of 575', 'TP53', 'BRAF'],
            ['Showing 1 to 20 of 6,962', 'chr7:g.140753336A>T', 'chr2:g.208248388C>T']
        )

        selectResultsTab(0)

        // Add tracks and check that they were added
        cy.get('.dijitTabContainer').eq(1).within(() => {
            cy.contains('All Genes').eq(0).click()
            cy.contains('All Mutations').eq(0).click()
            cy.contains('All CNVs').eq(0).click()
        })

        closePopup()

        cy.wait(['@getMutationTrack.all', '@getGeneTrack.all', '@getCNVTrack.all'])

        // Check that tracks are added
        cy.contains('GDC_Genes_TCGA-A5-A1OF')
        cy.contains('GDC_SimpleSomaticMutations_TCGA-A5-A1OF')
        cy.contains('GDC_CNVs_TCGA-A5-A1OF')
    })
})
