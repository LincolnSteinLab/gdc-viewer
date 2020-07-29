---
layout: default
title: Installation
nav_order: 2
---

# Installation and Setup
The installation assumes you are working on an Ubuntu or MacOS machine.

## 0. Install dependencies
* [Yarn](ttps://classic.yarnpkg.com/en/docs/install/)

* [Node](https://nodejs.org/en/download/)

Note: You may find it easier to use a node versioning tool to install Node. Two popular tools are [n](https://github.com/tj/n) and [nvm](https://github.com/nvm-sh/nvm).

## 1. Install JBrowse
Clone the JBrowse repostitory. Don't switch into the directory just yet.
```bash
git clone https://github.com/GMOD/jbrowse
```

We will use the placeholder `<jbrowse-location>` to refer to where JBrowse is install on your computer. An example would be `/Users/aduncan/Downloads/jbrowse`.

## 2. Install GDC Plugin
Clone the GDC plugin and then copy the gdc-viewer subfolder into the JBrowse plugins directory.
```bash
git clone https://github.com/agduncan94/gdc-viewer.git
cp -R gdc-viewer/gdc-viewer <jbrowse-location>/plugins/gdc-viewer
```

Now add the 'gdc-viewer' plugin to the array of plugins in the `<jbrowse-location>/jbrowse.conf`.
```ini
[ plugins.gdc-viewer ]
location = <jbrowse-location>/plugins/gdc-viewer
```

## 3. Install Reference Sequence Data
Now setup the reference sequence used. GDC requires the GRCh38 Human reference files.

Create the `data` directory in `<jbrowse-location>/data`.

```bash
cd <jbrowse-location>
mkdir data
cd data
```

Download the GRCh38 `.fa` and `.fa.fai` files online. Two places you could find these files are:
* https://s3.amazonaws.com/igv.org.genomes/genomes.json
* http://bioinfo.hpc.cam.ac.uk/downloads/datasets/fasta/grch38/

Then put the following in `<jbrowse-location>/data/tracks.conf` (note files may be named something else).

```ini
refSeqs=hg38.fa.fai
  
[tracks.refseqs]
urlTemplate=hg38.fa
```

## 4. Adding new tracks (optional)
We have some basic example tracks in the [data/tracks.conf](https://github.com/agduncan94/gdc-viewer/blob/develop/data/tracks.conf) file of the gdc-viewer repository.

You can also add new tracks by using the GDC dialog accessible within JBrowse. [See the tracks page]({{ site.url }}{% link tracks.md %}).

## 5. Build JBrowse
Run the following commands to build JBrowse and the GDC plugin.

**Note that ./setup.sh prints some errors about volvox, but they can be ignored. It may also take a few minutes.**
```bash
cd <jbrowse-location>
./setup.sh
yarn
```

## 5. Run JBrowse
Then run the following commands:

```bash
yarn watch
# open a new terminal tab/window
yarn start
```

JBrowse should now be running with the GDC Plugin working! See the `yarn start` command to determine the port that the plugin is using.

# JBrowse configuration
## Faceted Track Selector
Add the following to your `<jbrowse-location>/jbrowse.conf` to use the faceted track selector.
```ini
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