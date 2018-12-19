# GDC JBrowse Plugin - Faceted Search and New Store Classes
A plugin for [JBrowse](https://jbrowse.org/) for viewing [GDC](https://gdc.cancer.gov/) data. For any bugs, issues, or feature recommendations please create an issue through GitHub.

# Installation and Setup
## 1. Install JBrowse
Quick setup of JBrowse - https://github.com/GMOD/jbrowse/#install-jbrowse-from-github-for-developers

## 2. Install Plugin
See [JBrowse - Installing Plugins](https://jbrowse.org/docs/plugins.html) for a general approach to installing plugins.

For installing gdc-viewer plugin:
1) Copy the gdc-viewer folder into the JBrowse `plugins` directory.
2) Add 'gdc-viewer' to the array of plugins in the `jbrowse_conf.json`.

## 3. Install Reference Sequence Data
Now setup the reference sequence used. GDC requires the GRCh38 Human reference files, which can be found at http://ftp.ensembl.org/pub/release-94/fasta/homo_sapiens/dna/. You'll want to download the files of the form `Homo_sapiens.GRCh38.dna.chromosome.1.fa.gz`.

Then you can use the `bin/prepare-refeqs.pl` command to generate the RefSeq information.

Below is an example of these two steps for Chr1.

Ex. Chromosome 1
1. Download Homo_sapiens.GRCh38.dna.chromosome.1.fa.gz from the above site.
```
wget http://ftp.ensembl.org/pub/release-75/fasta/homo_sapiens/dna/Homo_sapiens.GRCh38.dna.chromosome.1.fa.gz
```
2. Setup refeq with the following command
```
bin/prepare-refseqs.pl --fasta Homo_sapiens.GRCh38.dna.chromosome.1.fa.gz
```
Note that you can specify multiple fast in one command by doing `--fasta fasta1.fa.gz --fasta fasta2.fa.gz ...`

## 4. Adding new tracks
We have some basic example tracks in `data/tracks.conf`. You can also add new tracks by using the GDC Dialog accessible within JBrowse.

## 5. Run JBrowse
You'll have to run the following commands:

```
./setup.sh
utils/jb_run.js -p 3000
```

JBrowse should now be running with the GDC Plugin working!


# JBrowse configuration
## Faceted Track Selector
Add the following to your jbrowse.conf to use the faceted track selector.
```
[trackSelector]
type = Faceted
displayColumns =
  + label
  + key
  + datatype
```

# Available Store SeqFeature
## Genes
A simple view of all of the genes seen across all cases.

Example Track:
```
[tracks.GDC_Genes]
storeClass=gdc-viewer/Store/SeqFeature/Genes
type=JBrowse/View/Track/CanvasVariants
key=GDC Genes
metadata.datatype=Gene
```

## SSMs
A simple view of all of the simple somatic mutations seen across all cases.

Example Track:
```
[tracks.GDC_SSM]
storeClass=gdc-viewer/Store/SeqFeature/SimpleSomaticMutations
type=JBrowse/View/Track/CanvasVariants
key=GDC SSM
metadata.datatype=SSM
```

## CNVs
A simple view of all of the CNVs seen across all cases.

Example Track:
```
[tracks.GDC_CNV]
storeClass=gdc-viewer/Store/SeqFeature/CNVs
type=JBrowse/View/Track/Wiggle/XYPlot
key=GDC CNV
metadata.datatype=CNV
autoscale=local
bicolor_pivot=0
```

Note: You can also use a density plot for the copy number data. Simply change the type from `JBrowse/View/Track/Wiggle/XYPlot` to `JBrowse/View/Track/Wiggle/Density.`