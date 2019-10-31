/**
 * Tests the project dialog
 */
describe('Project dialog', function() {
    before(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')
        cy.wait(1000) // Wait for load
    })

    it('Should be able to view projects', function() {
        // Open track menu
        cy.get('#dropdownbutton_gdc').type('{enter}')
        cy.contains('Explore Projects').click()

        // Check that projects viewer is opened and has expected content
        cy.contains('View projects available on the GDC Data Portal')
        cy.contains('FM-AD')
        cy.get('.results-table').should('be.visible')

        // Add SSM, Gene, and CNV tracks for project FM-AD (assume first in list)
        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('SSMs for Project').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('Genes for Project').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('CNVs for Project').click()

        cy.contains('GDC Project Browser').parent().within(() => {
            cy.get('.dijitDialogCloseIcon').click()
        })
    })
})