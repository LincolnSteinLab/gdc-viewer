---
layout: default
title: Developers
nav_order: 4
---
# Extra Notes for Developers
This section just goes over some areas of the code to help new developers navigate.

## js/Model
These files override the function for printing to the feature dialog. It overrides the get function to display content that requires extra API calls (on top of the call to grab the whole track). For example, this is used to generate the projects table shown on Mutations and gene feature dialogs.

## js/Store/SeqFeature
These files connect the GDC API to JBrowse by creating a set of features based on an API call.

## js/View
The top level contains files that create the various dialog boxes that appear in the menu bar. These allow for the dynamic generation of tracks.

### Export
These files define export types for mutation, gene, and CNV tracks.

### Track
These files extend the track dropdown options to include things like shareable links and view filters. This is also where overrides for the format of the feature dialogs are.