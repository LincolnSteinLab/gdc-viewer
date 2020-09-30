// Tests the exporting of Gene tracks
describe('Gene track', function() {
    beforeEach(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')

        cy
            .server()

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/GenesTable',
                response: 'fixture:ExportGenes/GenesTable.json'
              }).as('getGeneTable')

        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/projectsTable',
                response: 'fixture:ExportGenes/ProjectTable.json'
            }).as('getProjectsTable')

        // Open track menu
        cy.contains('Select').click()
        cy.wait(1000)

        // Add existing gene track (GDC_Genes)
        cy.get('#trackSelectGrid_rowSelector_1').click()
        cy.wait('@getGeneTable.all')

        // Close track menu
        cy.contains('Back to browser').click()

        // Gene track should be added
        cy.contains('GDC_Genes')
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
            cy.wait('@getGeneTable').then(() => {
                cy.wait(3000) // Give time to process results
                cy.wait(['@getProjectsTable.all']).then(() => {
                    cy.wait(3000) // Give time to process results
                    for (var text of textValues) {
                        cy.get('textarea').should('to.include.value', text)
                    }
                })
            })
        } else {
            cy.wait('@getGeneTable').then(() => {
                cy.wait(3000) // Give time to process results
                for (var text of textValues) {
                    cy.get('textarea').should('to.include.value', text)
                }
            })
        }
        cy.contains('Close').click()
    }

    // Tests the exporting feature for genes
    // Assumption: loc=1%3A1..248956422
    it('Should be able to export Genes in various export formats', function() {
        testExport(2, 'GFF3', ['##gff-version 3', '##sequence-region', 'Gene'])
        testExport(3, 'BED', ['track name="GDC_Genes" useScore=0', '1	152302174	152325203	ENSG00000143631		-'])
        testExport(4, 'CSV', ['id,type,start,end,chromosome,strand,gene name,biotype,symbol,synonyms', 'ENSG00000143631,Gene,152302174,152325203,1,-1,filaggrin,protein_coding,FLG'])
        testExport(5, 'Sequin Table', ['>Feature 1', '152325203	152302175	Gene'])
        cy.fixture('ExportGenes/track-conf-export.conf').then((json) => {
            testExport(6, 'Track Config', [json])
        })
        testExport(7, 'Track Config JSON',
        [
`{
\t"label": "GDC Genes",
\t"storeClass": "gdc-viewer/Store/SeqFeature/Genes",
\t"type": "gdc-viewer/View/Track/GeneTrack",
\t"key": "GDC Genes",
\t"metadata": {
\t\t"datatype": "Genes"
\t},
\t"size": 100,
\t"filters": "[]"
}`
        ])
    })

    it('Should be able to share a Gene track as a URL', function() {
        cy.get('.track-menu-button').click()
        cy.contains('Share Track as URL').click()
        cy.get('textarea').should('have.value', 'http://localhost:3000/?loc=1%3A1..248956422&tracks=GDC_Genes&highlight=&addTracks=%5B%7B%22label%22%3A%22GDC_Genes%22%2C%22storeClass%22%3A%22gdc-viewer%2FStore%2FSeqFeature%2FGenes%22%2C%22type%22%3A%22gdc-viewer%2FView%2FTrack%2FGeneTrack%22%2C%22key%22%3A%22GDC+Genes%22%2C%22metadata%22%3A%7B%22datatype%22%3A%22Gene%22%7D%7D%5D')
    })
})
