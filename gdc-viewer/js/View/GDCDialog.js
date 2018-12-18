define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/form/Button',
    'dijit/form/CheckBox',
    'dijit/layout/TabContainer',
    'dijit/layout/AccordionContainer',
    'dijit/layout/ContentPane',
    'dojo/aspect',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    focus,
    Button,
    CheckBox,
    TabContainer,
    AccordionContainer,
    ContentPane,
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {

        constructor: function() {
            var thisB = this;

            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },
        
        _dialogContent: function () {
            var thisB = this;
            var container = dom.create('div', { className: 'dialog-container', style: { width: '1000px', height: '700px' } });

            thisB.resize();
            return container;
        },


        show: function (browser, callback) {
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', 'GDC Browser');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }
        
    });
});