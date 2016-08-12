const Reflux = require('reflux');

module.exports = {
  selectDrilldown: Reflux.createActions([
    'allAmount',
    'amountByOrg',
    'amountBySdg',
  ]),
};
