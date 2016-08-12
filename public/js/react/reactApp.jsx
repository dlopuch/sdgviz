const React = require('react');
const ReactDOM = require('react-dom');
const DisplayCrossfilterData = require('./DisplayCrossfilterData.jsx');

module.exports = function reactApp() {
  ReactDOM.render(
    <div className="container-fluid">
      <div>
        Heyo! This is our react container!
        <DisplayCrossfilterData></DisplayCrossfilterData>
      </div>
    </div>,
    document.getElementById('react-app')
  );
}