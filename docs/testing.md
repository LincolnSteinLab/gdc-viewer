---
layout: default
title: Testing
nav_order: 5
---
# Automated testing
Cypress.io is used for testing this plugin. The following steps show how to run the tests locally.
1. Install JBrowse but don't install chromosome files.
2. Download Chr 1 fasta from `http://ftp.ensembl.org/pub/release-94/fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.chromosome.1.fa.gz`. There should be the fasta index file in `cypress/data/Homo_sapiens.GRCh38.dna.chromosome.1.fa.fai`. Put these files into `jbrowse/data/`.
3. Install Cypress.io with `npm install`.
4. Place `cypress/data/tracks.conf` into your `jbrowse/data/` directory. Make sure no other tracks are present.
5. Run `npx cypress open` or `npx cypress run` or `npm run e2e`

**Note** while some tests have mocked endpoints, not all endpoints are mocked. This could lead to breakage of tests in the future.