define([
           'dojo/_base/declare',
           'dojo/_base/lang',
           'JBrowse/Plugin',
           'dijit/Menu',
           'dijit/MenuItem',
           'dijit/PopupMenuItem',
           './View/GDCDialog',
           './View/GDCProjectDialog',
           './View/GDCPrimarySitesDialog',
           './View/GDCStoreTokenDialog',
           './View/GDCByFileIdDialog'
       ],
       function(
           declare,
           lang,
           JBrowsePlugin,
           Menu,
           MenuItem,
           PopupMenuItem,
           GDCDialog,
           GDCProjectDialog,
           GDCPrimarySitesDialog,
           GDCStoreTokenDialog,
           GDCByFileIdDialog
       ) {
return declare( JBrowsePlugin,
{
    constructor: function () {
        this.browser.afterMilestone('initView', function () {
            var explorationSubmenu = new Menu();
            explorationSubmenu.addChild(new MenuItem({
                label: 'Explore cases, genes and mutations',
                onClick: lang.hitch(this, 'createGDCExplore')
            }));
            explorationSubmenu.addChild(new MenuItem({
                label: 'Explore projects',
                onClick: lang.hitch(this, 'createGDCProject')
            }));
            explorationSubmenu.addChild(new MenuItem({
                label: 'Explore primary sites',
                onClick: lang.hitch(this, 'createGDCPrimarySites')
            }));
            this.browser.addGlobalMenuItem('gdc', new PopupMenuItem({
                label: "Exploration",
                iconClass: "dijitIconSearch",
                popup: explorationSubmenu
            }));

            var fileSubmenu = new Menu();
            fileSubmenu.addChild(new MenuItem({
                label: 'Add tracks by file id',
                onClick: lang.hitch(this, 'createGDCByFileId')
            }));
            fileSubmenu.addChild(new MenuItem({
                label: 'Login',
                onClick: lang.hitch(this, 'createGDCLogin')
            }));
            this.browser.addGlobalMenuItem('gdc', new PopupMenuItem({
                label: "Repository files",
                iconClass: "dijitIconFile",
                popup: fileSubmenu
            }));
        
            this.browser.renderGlobalMenu('gdc', {text: 'GDC'}, this.browser.menuBar);
        }, this);            
    },

    /**
     * Create the dialog for exploring the GDC
     */
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

    /**
     * Create the dialog for viewing GDC projects
     */
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

    /**
     * Create the dialog for viewing GDC primary sites
     */
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
    },

    /**
     * Create the dialog for logging in to the GDC
     */
    createGDCLogin: function () {
        var searchDialog = new GDCStoreTokenDialog(
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

    /**
     * Create the dialog for adding files by ID
     */
    createGDCByFileId: function () {
        var searchDialog = new GDCByFileIdDialog(
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
});
});
