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
                url: 'v0/graphql/projects-dialog',
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
        cy.contains('Explore projects').click()

        cy.wait('@getProjects')

        // Check that projects viewer is opened and has expected content
        cy.contains('View projects available on the GDC Data Portal')
        cy.contains('FM-AD')
        cy.get('.results-table').should('be.visible')

        // Add SSM, Gene, and CNV tracks for project FM-AD (assume first in list)
        // Note that even though we select FM-AD, we are mocking TCGA-BRCA
        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('Mutations').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('Genes').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('CNVs').click()

        cy.contains('GDC Project Browser').parent().within(() => {
            cy.get('.dijitDialogCloseIcon').click()
        })

        // Tracks should be added for project FM-AD
        cy.wait(['@getMutations.all', '@getGenes.all', '@getCNVs.all'])
        cy.contains('GDC_SimpleSomaticMutations_FM-AD')
        cy.contains('GDC_Genes_FM-AD')
        cy.contains('GDC_CNVs_FM-AD')

        // Stub some responses for viewing a mutation
        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/ssm-projects',
                response: 'fixture:projects/mutation-projects.json'
              }).as('getProjectsForMutation')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/projectsTable',
                response: 'fixture:projects/project-table.json'
                }).as('getProjectTable')
                
        // Select a mutation from the track
        cy.get('.track_gdc_viewer_view_track_ssmtrack').within(() => {
            cy.get('.feature').eq(1).click()
        })

        // Ensure mutation has right data
        cy.get('.popup-dialog').within(() => {
            cy.wait('@getProjectsForMutation')
            cy.contains('Simple Somatic Mutation')
            cy.contains('chr1:g.52055208delT')
            cy.contains('7ffb5e22-05d6-5664-a0b0-908184bacbb9')
            cy.contains('T')
            cy.contains('Small deletion')
            cy.contains('15664798')

            cy.contains('TXNDC12')
            cy.contains('5_prime_UTR_variant')
            cy.contains('c.-112delA')
            cy.contains('ENST00000371626 (C)')

            cy.wait('@getProjectTable')

            cy.contains('TCGA-COAD')
            cy.contains('Cystic, Mucinous and Serous Neoplasms')
            cy.contains('Rectosigmoid junction')
            cy.contains('6/400 (1.50%)')

            cy.get('.dijitDialogCloseIcon').click()
        })

        // Stub some responses for viewing a gene
        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/gene-projects',
                response: 'fixture:projects/gene-projects.json'
              }).as('getProjectsForGene')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/projectsTable',
                response: 'fixture:projects/project-table-gene.json'
                }).as('getProjectTable')

        // Select a gene from the track
        cy.get('.track_gdc_viewer_view_track_genetrack').within(() => {
            cy.get('.feature').eq(5).click()
        })

        // Ensure gene has right data
        cy.get('.popup-dialog').within(() => {
            cy.wait('@getProjectsForGene')
            cy.contains('Gene')
            cy.contains('The protein encoded by this gene is expressed in the brain, predominantly in the parietal and frontal cortex as well as in dorsal root ganglia.')
            cy.contains('protein_coding')
            cy.contains('seizure threshold 2 homolog (mouse)')
            cy.contains('ENSG00000198198')
            cy.contains('SZT2')

            cy.wait('@getProjectTable')

            cy.contains('TCGA-UCEC')
            cy.contains('Not Reported')
            cy.contains('Cystic, Mucinous and Serous Neoplasms')
            cy.contains('Corpus uteri')
            cy.contains('103/530 (19.43%)')
            cy.contains('32/510 (6.27%')
            cy.contains('13/510 (2.55%)')

            cy.get('.dijitDialogCloseIcon').click()
        })
    })
})