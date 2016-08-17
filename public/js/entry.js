const reactApp = require('./react/reactApp.jsx');
window.d3 = require('d3');

// Load d3 plugins:
// TODO: Doesn't work.  The plugin extends module's own dependency d3-selection, not above.
// Webpack/npm issue?
// require('d3-selection-multi');

require('./style.less');

const promiseData = require('./promiseData');
const ChartBaseView = require('./charts/ChartBaseView');
const actions = require('./actions');

window.actions = actions;

window.onload = function onload() {
  promiseData.then(data => {
    console.log('GOT DATA!', data);
    window.hdData = data;
  });

  let chartBaseView = new ChartBaseView('#sdgv-svg');
  window.chartBaseView = chartBaseView;

  reactApp();

  // Start it
  actions.selectDrilldown.allAmount();
};
