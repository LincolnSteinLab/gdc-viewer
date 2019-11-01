/**
 * Tests the project dialog
 */
describe('Project dialog', function() {
    before(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')
        cy.wait(1000) // Wait for load
        cy
            .server()

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/projects',
                response: 'fixture:projects/projects.json'
              }).as('getProjects')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/SsmsTable',
                response: 'fixture:projects/mutations.json'
            }).as('getMutations')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/GenesTable',
                response: 'fixture:projects/genes.json'
            }).as('getGenes')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/CNVsTable',
                response: 'fixture:projects/cnvs.json'
                }).as('getCNVs')
    })

    it('Should be able to view projects', function() {
        // Open track menu
        cy.get('#dropdownbutton_gdc').type('{enter}')
        cy.contains('Explore Projects').click()

        cy.wait('@getProjects')

        // Check that projects viewer is opened and has expected content
        cy.contains('View projects available on the GDC Data Portal')
        cy.contains('FM-AD')
        cy.get('.results-table').should('be.visible')

        // Add SSM, Gene, and CNV tracks for project FM-AD (assume first in list)
        // Note that even though we select FM-AD, we are mocking TCGA-BRCA
        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('SSMs for Project').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('Genes for Project').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('CNVs for Project').click()

        cy.contains('GDC Project Browser').parent().within(() => {
            cy.get('.dijitDialogCloseIcon').click()
        })

        // Tracks should be added for project FM-AD
        cy.wait(['@getMutations.all', '@getGenes.all', '@getCNVs.all'])
        cy.contains('GDC_SimpleSomaticMutations_FM-AD')
        cy.contains('GDC_Genes_FM-AD')
        cy.contains('GDC_CNVs_FM-AD')
    })
})