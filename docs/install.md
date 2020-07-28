---
layout: default
title: Installation
nav_order: 2
---

# Installation and Setup
The installation assumes you are working on an Ubuntu machine.

## 1. Install JBrowse

Clone the JBrowse repostitory and enter.
```
git clone https://github.com/GMOD/jbrowse
cd jbrowse
```

## 2. Install Plugin
Clone the GDC plugin in a new terminal window and then copy the gdc-viewer subfolder into the JBrowse plugins directory.
```
git clone git@github.com:agduncan94/gdc-viewer.git
cp -R gdc-viewer/gdc-viewer <jbrowse-location>/plugins/gdc-viewer
```

Now add the 'gdc-viewer' plugin to the array of plugins in the `jbrowse/jbrowse_conf.json`.
```
[ plugins.gdc-viewer ]
location = <jbrowse-location>/plugins/gdc-viewer
```

See [JBrowse - Installing Plugins](https://jbrowse.org/docs/plugins.html) for a general approach to installing plugins.

## 3. Install Reference Sequence Data
Now setup the reference sequence used. GDC requires the GRCh38 Human reference files.

First create the `data` directory in `jbrowse/data`

```
mkdir data
```

Download the GRCh38 `.fa` and `.fa.fai` files online (ex. http://bioinfo.hpc.cam.ac.uk/downloads/datasets/fasta/grch38/). Then put the following in `./data/tracks.conf` (note files may be named something else).

```
refSeqs=reference_genome.fa.fai
  
[tracks.refseqs]
urlTemplate=reference_genome.fa
```

## 4. Adding new tracks (optional)
We have some basic example tracks in `data/tracks.conf`. You can also add new tracks by using the GDC dialog accessible within JBrowse.

## 5. Build JBrowse
Run the following commands to build JBrowse and the GDC plugin.

**Note that ./setup.sh prints some errors about volvox, but they can be ignored. It may also take a few minutes**
```
./setup.sh
yarn
```

## 5. Run JBrowse
You'll have to run the following commands:

```
yarn watch
yarn start (in a new terminal tab/window)
```

JBrowse should now be running with the GDC Plugin working!

# JBrowse configuration
## Faceted Track Selector
Add the following to your `jbrowse/jbrowse.conf` to use the faceted track selector.
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