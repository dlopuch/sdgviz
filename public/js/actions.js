const Reflux = require('reflux');

module.exports = {
  selectDrilldown: Reflux.createActions([
    'allAmount',
    'amountByOrg',
    'amountBySdg',
  ]),

  interactions: Reflux.createActions([
    /**
     * Indicates some UI element is hovering over a drilldown's subcategory
     * @param {string | null} drilldownKey Key string of drilldown item being hovered, or null to clear
     */
    'hoverDrilldown',

    /**
     * Indicates some UI element clicked a drilldown's subcategory
     * @param {string} drilldownKey Which drilldown was clicked
     * @param {boolean} [expand] Optional: whether it should be expanded or not.
     */
    'clickDrilldown',
  ]),
};
