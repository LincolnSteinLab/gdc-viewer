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

        cy.wait(1000) // Wait for load
        openExploreDialog()
    })

    /**
     * Opens the explore dialog
     */
    var openExploreDialog = function () {
        cy.get('#dropdownbutton_gdc').type('{enter}')
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
     * Assumes donor tab is already selected
     * @param {*} donorArray array of strings to check for on donor tab
     * @param {*} geneArray array of strings to check for on gene tab
     * @param {*} mutationArray array of strings to check for on mutation tab
     */
    var checkAllResultsTab = function(donorArray, geneArray, mutationArray) {
        cy.wait(['@getMutationTrack', '@getGeneTrack'])
        cy.wait(3000) // wait a few seconds for results to load
        // Validate donor results
        checkResultsTab(donorArray)

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
            selectFacetTab(0, 0, 0)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 1,292', 'TCGA-A5-A1OF', 'TCGA-AJ-A3EK'],
            ['Showing 1 to 20 of 21,168', 'TP53', 'TTN'],
            ['Showing 1 to 20 of 120,824', 'chr2:g.208248388C>T', 'chr17:g.7673803G>A']
        )

        // Select is cancer gene census - 1
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(1, 1, 0)
        })

        checkAllResultsTab(
            ['Showing 1 to 20 of 364', 'TCGA-A5-A1OF', 'TCGA-AJ-A3EK'],
            ['Showing 1 to 20 of 575', 'TP53', 'PIK3CA'],
            ['Showing 1 to 20 of 5,949', 'chr7:g.140753336A>T', 'chr2:g.208248388C>T']
        )

        selectResultsTab(0)

        // Add tracks and check that they were added
        cy.get('.dijitTabContainer').eq(1).within(() => {
            cy.contains('All Genes for Donor').eq(0).click()
            cy.contains('All SSMs for Donor').eq(0).click()
        })

        closePopup()

        cy.wait(['@getMutationTrack.all', '@getGeneTrack.all'])

        // Check that tracks are added
        cy.contains('GDC_Genes_286c112d-7b73-40a1-b23c-99911388fdef')
        cy.contains('GDC_SimpleSomaticMutations_286c112d-7b73-40a1-b23c-99911388fdef')
    })
})