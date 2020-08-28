/**
 * A Dialog for getting the token information of the user
 */
define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dojo/aspect',
    'JBrowse/View/Dialog/WithActionBar',
    'dijit/form/TextBox',
    'dijit/form/Button'
],
function (
    declare,
    dom,
    focus,
    aspect,
    ActionBarDialog,
    TextBox,
    Button
) {
    return declare(ActionBarDialog, {

        // Parent DOM to hold results
        dialogContainer: undefined,

        /**
         * Constructor
         */
        constructor: function () {
            var thisB = this;

            aspect.after(this, 'hide', function () {
                focus.curNode && focus.curNode.blur();
                setTimeout(function () { thisB.destroyRecursive(); }, 500);
            });
        },

        /**
         * Create a DOM object containing GDC primary site interface
         * @return {object} DOM object
         */
        _dialogContent: function () {
            var thisB = this;
            // Container holds all results in the dialog
            thisB.dialogContainer = dom.create('div', { className: 'dialog-container', style: { width: '700px', height: '500px' } });

            // Create header section
            thisB.createHeaderSection();

            thisB.searchContainer = dom.create('div', { className: 'flexHolder', style: { 'justify-content': 'center', 'align-content': 'center' } }, thisB.dialogContainer);

            var tokenTextBox = new TextBox({
                name: "token",
                value: "",
                placeHolder: "Enter your token",
                style: { 'flex': '3 0 0'}
            }).placeAt(thisB.searchContainer);

            var loginButton = new Button({
                label: 'Login',
                style: { 'flex': '1 0 0'},
                onClick: function() {
                    sessionStorage.setItem('token', tokenTextBox.get("value"));
                }
            }).placeAt(thisB.searchContainer);

            // Update the form
            thisB.resize();

            return thisB.dialogContainer;
        },

        /**
         * Add a header section with a title
         */
        createHeaderSection: function() {
            var thisB = this;
            var headerSection = dom.create('div', { style: "margin-bottom: 5px;" }, thisB.dialogContainer);
            var aboutMessage = dom.create('h1', { innerHTML: "Login to access controlled data" }, headerSection);
            var pageExplanation = dom.create('div', { innerHTML: "An authentication token is required to access controlled data.", style: "font-size: 14px; margin-bottom: 5px; padding: 5px; margin-top:5px;" }, headerSection);
            var pageExplanationTwo = dom.create('div', { innerHTML: "You will need to provide your authentication token any time you start a new session as the token is deleted when the session expires.", style: "font-size: 14px; margin-bottom: 5px; padding: 5px; margin-top:5px;" }, headerSection);

        },

        /**
         * Show callback for displaying dialog
         * @param {*} browser 
         * @param {*} callback 
         */
        show: function (browser, callback) {
            this.browser = browser;
            this.callback = callback || function () {};
            this.set('title', 'GDC Login');
            this.set('content', this._dialogContent());
            this.inherited(arguments);
            focus.focus(this.closeButtonNode);
        }
    });
});