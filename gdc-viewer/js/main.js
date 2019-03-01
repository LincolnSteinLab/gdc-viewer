define([
           'dojo/_base/declare',
           'dojo/_base/lang',
           'JBrowse/Plugin',
           'dijit/MenuItem',
           './View/GDCDialog',
           './View/GDCProjectDialog',
           './View/GDCPrimarySitesDialog'
       ],
       function(
           declare,
           lang,
           JBrowsePlugin,
           MenuItem,
           GDCDialog,
           GDCProjectDialog,
           GDCPrimarySitesDialog
       ) {
return declare( JBrowsePlugin,
{
    constructor: function () {
        this.browser.afterMilestone('initView', function () {
            this.browser.addGlobalMenuItem('gdc', new MenuItem(
                {
                    label: 'Explore GDC',
                    iconClass: "dijitIconSearch",
                    onClick: lang.hitch(this, 'createGDCExplore')
                }));
            this.browser.addGlobalMenuItem('gdc', new MenuItem(
                {
                    label: 'GDC Projects',
                    iconClass: "dijitIconSearch",
                    onClick: lang.hitch(this, 'createGDCProject')
                }));
            this.browser.addGlobalMenuItem('gdc', new MenuItem(
                {
                    label: 'GDC Primary Sites',
                    iconClass: "dijitIconSearch",
                    onClick: lang.hitch(this, 'createGDCPrimarySites')
                }));
            this.browser.renderGlobalMenu('gdc', {text: 'GDC'}, this.browser.menuBar);
        }, this);            
    },

    createGDCExplore: function () {
        var searchDialog = new GDCDialog(
            {
                onHide: function() {
                    this.destroy();
                }
            }
        );
        searchDialog.show(this.browser,
            function () {
            }
        );
    },

    createGDCProject: function () {
        var searchDialog = new GDCProjectDialog(
            {
                onHide: function() {
                    this.destroy();
                }
            }
        );
        searchDialog.show(this.browser,
            function () {
            }
        );
    },

    createGDCPrimarySites: function () {
        var searchDialog = new GDCPrimarySitesDialog(
            {
                onHide: function() {
                    this.destroy();
                }
            }
        );
        searchDialog.show(this.browser,
            function () {
            }
        );
    }
});
});
