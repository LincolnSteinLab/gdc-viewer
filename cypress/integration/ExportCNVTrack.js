// Tests the exporting of CNV tracks
describe('CNV track', function() {
    beforeEach(function() {
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')

        cy
            .server()
        
        cy
            .route({
                method: 'POST',
                url: 'v0/graphql/CNVsTable',
                response: 'fixture:ExportCNVs/CNVsTable.json'
              }).as('getCNVTable')

        // Open track menu
        cy.contains('Select').click()
        cy.wait(1000)

        // Add existing CNV track (CNV_Genes)
        cy.get('#trackSelectGrid_rowSelector_0').click()
        cy.wait('@getCNVTable.all')

        // Close track menu
        cy.contains('Back to browser').click()

        // CNV track should be added
        cy.contains('GDC CNV')
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
        cy.wait('@getCNVTable').then(() => {
            cy.wait(3000) // Give time to process results
            for (var text of textValues) {
                cy.get('textarea').should('to.include.value', text)
            }
        })
        cy.contains('Close').click()
    }

    // Tests the exporting feature for CNVs
    // Assumption: loc=1%3A1..248956422
    it('Should be able to export CNV in various export formats', function() {
        testExport(2, 'GFF3', ['##gff-version 3', '##sequence-region'])
        testExport(3, 'bedGraph', ['track type=bedGraph name="GDC_CNV"', '1	51354263	51519328	-1'])
        testExport(4, 'CSV', ['start,end,score', '51354263,51519328,-1'])
        testExport(5, 'Wiggle', ['track type=wiggle_0 name="GDC_CNV"', 'variableStep chrom=1 span=165065'])
        cy.fixture('ExportCNVs/track-conf-export.conf').then((json) => {
            testExport(6, 'Track Config', [json])
        })
        testExport(7, 'Track Config JSON', 
        [
`{
\t"label": "GDC CNV",
\t"storeClass": "gdc-viewer/Store/SeqFeature/CNVs",
\t"type": "gdc-viewer/View/Track/CNVTrack",
\t"key": "GDC CNV",
\t"metadata": {
\t\t"datatype": "CNVs"
\t},
\t"size": 500,
\t"filters": "[]"
}`
        ])
    })

    // it('Should be able to share a CNV track as a URL', function() {
    //     cy.get('.track-menu-button').click()
    //     cy.contains('Share Track as URL').click()
    //     cy.get('textarea').should('have.value', 'http://localhost:3000/?loc=1%3A1..248956422&tracks=GDC_CNV&highlight=&addTracks=%5B%7B%22label%22%3A%22GDC_CNV%22%2C%22storeClass%22%3A%22gdc-viewer%2FStore%2FSeqFeature%2FCNVs%22%2C%22type%22%3A%22gdc-viewer%2FView%2FTrack%2FCNVTrack%22%2C%22key%22%3A%22GDC+CNV%22%2C%22metadata%22%3A%7B%22datatype%22%3A%22CNV%22%7D%7D%5D')
    // })
})