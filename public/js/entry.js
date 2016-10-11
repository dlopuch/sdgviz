const reactApp = require('./react/reactApp.jsx');

// Load d3 plugins:
// TODO: Doesn't work.  The plugin extends module's own dependency d3-selection, not above.
// Webpack/npm issue?
// window._d3 = require('d3');
// require('d3-selection-multi');

require('./style.less');

const promiseData = require('./promiseData');
const actions = require('./actions');

window.onload = function onload() {
  promiseData.then(data => {
    window._sdgChallengeData = data;
  });

  reactApp();

  // Start it
  actions.selectDrilldown.allAmount();
};
