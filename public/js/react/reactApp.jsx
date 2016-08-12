const React = require('react');
const ReactDOM = require('react-dom');

const actions = require('../actions');

const DisplayCrossfilterData = require('./DisplayCrossfilterData.jsx');

module.exports = function reactApp() {
  ReactDOM.render(
    <div className="container-fluid">
      <div>
        <div className="sdgviz-select-drilldown">
          Select view:
          <button onClick={actions.selectDrilldown.allAmount}>All Pledges</button>
          <button onClick={actions.selectDrilldown.amountBySdg}>By SDG</button>
          <button onClick={actions.selectDrilldown.amountByOrg}>By Organization</button>
        </div>
        <DisplayCrossfilterData></DisplayCrossfilterData>
      </div>
    </div>,
    document.getElementById('react-app')
  );
}