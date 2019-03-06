define([
    'dojo/_base/declare',
    'dojo/dom-construct',
    'dijit/focus',
    'dijit/Tooltip',
    'dojo/aspect',
    'JBrowse/View/Dialog/WithActionBar'
],
function (
    declare,
    dom,
    focus,
    Tooltip,
    aspect,
    ActionBarDialog
) {
    return declare(ActionBarDialog, {
        // The base URL for GraphQL calls
        baseGraphQLUrl: 'https://api.gdc.cancer.gov/v0/graphql',
        
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
         * Adds a tooltip with some text to a location
         * @param {*} button Location to attach tooltip
         * @param {*} text Text to display in tooltip
         */
        addTooltipToButton: function(button, text) {
            var tooltip = new Tooltip({
                label: text
            });

            tooltip.addTarget(button);
        },

        /**
         * Creates a loading icon in the given location and returns
         * @param {object} location Place to put the loading icon
         * @return {object} loading icon
         */
        createLoadingIcon: function (location) {
            var loadingIcon = dom.create('div', { className: 'loading-gdc' }, location);
            var spinner = dom.create('div', {}, loadingIcon);
            return loadingIcon;
        },

        /**
         * Generate a GUID
         * @return {string} GUID
         */
        guid: function() {
            function s4() {
              return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
            }
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }
    });
});