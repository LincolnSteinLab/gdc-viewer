/**
 * Tests the primary sites dialog
 */
describe('Primary sites dialog', function() {
    before(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')
        cy.wait(1000) // Wait for load
        cy
            .server()

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/primarySites',
                response: 'fixture:primarySites/primarySites.json'
              }).as('getPrimarySites')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/SsmsTable',
                response: 'fixture:primarySites/mutations.json'
              }).as('getMutations')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/GenesTable',
                response: 'fixture:primarySites/genes.json'
              }).as('getGenes')

        cy
              .route({
                  method: 'POST',
                  url: 'v0/graphql/CNVsTable',
                  response: 'fixture:primarySites/cnvs.json'
                }).as('getCNVs')
    })

    it('Should be able to view primary sites', function() {
        // Open track menu
        cy.get('#dropdownbutton_gdc').type('{enter}')
        cy.contains('Explore primary sites').click()

        cy.wait('@getPrimarySites')

        // Check that primary site viewer is opened and has expected content
        cy.contains('View primary sites available on the GDC Data Portal')
        cy.contains('Bronchus and lung')
        cy.get('.results-table').should('be.visible')

        // Add SSM, Gene, and CNV tracks for primary site bronchus and lung (assume first in list)
        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('All Mutations').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('All Genes').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('All CNVs').click()

        cy.contains('GDC Primary Site Browser').parent().within(() => {
            cy.get('.dijitDialogCloseIcon').click()
        })

        // Tracks should be added for primary site bronchus and lung
        cy.wait(['@getMutations.all', '@getGenes.all', '@getCNVs.all'])
        cy.contains('GDC_SimpleSomaticMutations_Bronchus and lung')
        cy.contains('GDC_Genes_Bronchus and lung')
        cy.contains('GDC_CNVs_Bronchus and lung')
    })
})