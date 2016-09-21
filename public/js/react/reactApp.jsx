const React = require('react');
const ReactDOM = require('react-dom');

const actions = require('../actions');

const ChartContainer = require('./ChartContainer.jsx');
const DisplayCrossfilterData = require('./DisplayCrossfilterData.jsx');

module.exports = function reactApp() {
  ReactDOM.render(
    <div className="sdgv container-fluid">
      <h3>GSC Half-Billion Challenge Progress</h3>
      <div className="sdgviz-select-drilldown">
        Select view:
        <button onClick={actions.selectDrilldown.allAmount}>All Pledges</button>
        <button onClick={actions.selectDrilldown.amountBySdg}>By SDG</button>
        <button onClick={actions.selectDrilldown.amountByOrg}>By Organization</button>
      </div>

      <ChartContainer></ChartContainer>
      <DisplayCrossfilterData></DisplayCrossfilterData>
    </div>,
    document.getElementById('react-app')
  );
}