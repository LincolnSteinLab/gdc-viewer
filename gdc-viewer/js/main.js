define([
           'dojo/_base/declare',
           'dojo/_base/lang',
           'JBrowse/Plugin',
           'dijit/MenuItem',
           './View/GDCDialog'
       ],
       function(
           declare,
           lang,
           JBrowsePlugin,
           MenuItem,
           GDCDialog
       ) {
return declare( JBrowsePlugin,
{
    constructor: function () {
        this.browser.afterMilestone('initView', function () {
            this.browser.addGlobalMenuItem('gdc', new MenuItem(
                {
                    label: 'Search GDC',
                    iconClass: "dijitIconSearch",
                    onClick: lang.hitch(this, 'createGDCTrack')
                }));
                this.browser.renderGlobalMenu('gdc', {text: 'GDC'}, this.browser.menuBar);
        }, this);            
    },

    createGDCTrack: function () {
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
    }
});
});
