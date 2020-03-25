---
layout: default
title: Installation
nav_order: 2
---

# Installation and Setup
## 1. Install JBrowse
Follow JBrowse readme for [quick setup.](https://github.com/GMOD/jbrowse/#install-jbrowse-from-github-for-developers)

## 2. Install Plugin
See [JBrowse - Installing Plugins](https://jbrowse.org/docs/plugins.html) for a general approach to installing plugins.

For installing gdc-viewer plugin:
1. Copy the gdc-viewer folder into the JBrowse `plugins` directory.
2. Add 'gdc-viewer' to the array of plugins in the `jbrowse_conf.json`.

## 3. Install Reference Sequence Data
Now setup the reference sequence used. GDC requires the GRCh38 Human reference files.

Download the GRCh38 `.fa` and `.fa.fai` files online (ex. http://bioinfo.hpc.cam.ac.uk/downloads/datasets/fasta/grch38/). Then put the following in `./data/tracks.conf` (note files may be named something else).

```
refSeqs=GRCh38.genome.fa.fai
  
[tracks.refseqs]
urlTemplate=GRCh38.genome.fa
```

## 4. Adding new tracks
We have some basic example tracks in `data/tracks.conf`. You can also add new tracks by using the GDC dialog accessible within JBrowse.

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
  + case
  + project
  + primarySite
```

Note that this will only show preloaded tracks as well as tracks you have added using the various dialogs. It does not dynamically create tracks based on what is available from the GDC.