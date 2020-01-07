// Tests the exporting of SSM tracks
describe('SSM track', function() {
    beforeEach(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')

        cy
            .server()
        
        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/SsmsTable',
                response: 'fixture:ExportSSMs/SsmsTable.json'
              }).as('getSSMTable')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/ssm-projects',
                response: 'fixture:ExportSSMs/SSMProjects.json'
            }).as('getSSMProjects')
        
        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/projectsTable',
                response: 'fixture:ExportSSMs/ProjectTable.json'
            }).as('getProjectsTable')

        // Open track menu
        cy.contains('Select').click()
        cy.wait(1000)

        // Add existing SSM track (GDC_SSM)
        cy.get('#trackSelectGrid_rowSelector_2').click()
        cy.wait('@getSSMTable.all')

        // Close track menu
        cy.contains('Back to browser').click()

        // Gene track should be added
        cy.contains('GDC_SSM')
    })

    /**
     * Checks that export of a particular type works
     * @param {number} radioIndex Index of export checkbox
     * @param {string} exportType Name of export type
     * @param {Array<string>} textValues Values to check for in export
     */
    var testExport = function (radioIndex, exportType, textValues) {
        cy.get('.track-menu-button').click()
        cy.contains('Save track data').click()
        cy.contains(exportType)
        cy.get('.dijitCheckBoxInput').eq(radioIndex).click()

        cy.get('.dijitIconTask').click()
        if (radioIndex === 2) {
            cy.wait('@getSSMTable').then(() => {
                cy.wait(3000) // Give time to process results
                cy.wait(['@getSSMProjects.all', '@getProjectsTable.all']).then(() => {
                    cy.wait(3000) // Give time to process results
                    for (var text of textValues) {
                        cy.get('textarea').should('to.include.value', text)
                    }
                })
            })
        } else {
            cy.wait('@getSSMTable').then(() => {
                cy.wait(3000) // Give time to process results
                for (var text of textValues) {
                    cy.get('textarea').should('to.include.value', text)
                }
            })
        }
        cy.contains('Close').click()
    }

    // Tests the exporting feature for ssms
    // Assumption: loc=1%3A1..248956422
    it('Should be able to export SSMs in various export formats', function() {
        testExport(2, 'GFF3', ['##gff-version 3', '##sequence-region', 'Simple Somatic Mutation'])
        testExport(3, 'BED', ['track name="GDC_SSM" useScore=0', '1	56496417	56496417	ec690998-d555-5ed3-ab18-55e8685b2bfd'])
        testExport(4, 'CSV', ['id,type,start,end,chromosome,reference allele,dna change,subtype', 'ec690998-d555-5ed3-ab18-55e8685b2bfd,Simple Somatic Mutation,56496417,56496417,,T,chr1:g.56496417delT,Small deletion'])
        testExport(5, 'Sequin Table', ['>Feature 1', '56496418	56496417	Simple Somatic Mutation'])
        cy.fixture('ExportSSMs/track-conf-export.conf').then((json) => {
            testExport(6, 'Track Config', [json])
        })
        testExport(7, 'Track Config JSON', 
        [
`{
\t"label": "GDC SSM",
\t"storeClass": "gdc-viewer/Store/SeqFeature/SimpleSomaticMutations",
\t"type": "gdc-viewer/View/Track/SSMTrack",
\t"key": "GDC SSM",
\t"metadata": {
\t\t"datatype": "SimpleSomaticMutations"
\t},
\t"size": 100,
\t"filters": "[]"
}`
        ])
    })

    it('Should be able to share an SSM track as a URL', function() {
        cy.get('.track-menu-button').click()
        cy.contains('Share Track as URL').click()
        cy.get('textarea').should('have.value', 'http://localhost:3000/?loc=1%3A1..248956422&tracks=GDC_SSM&highlight=&addTracks=%5B%7B%22label%22%3A%22GDC_SSM%22%2C%22storeClass%22%3A%22gdc-viewer%2FStore%2FSeqFeature%2FSimpleSomaticMutations%22%2C%22type%22%3A%22gdc-viewer%2FView%2FTrack%2FSSMTrack%22%2C%22key%22%3A%22GDC+SSM%22%2C%22metadata%22%3A%7B%22datatype%22%3A%22SSM%22%7D%7D%5D')
    })
})