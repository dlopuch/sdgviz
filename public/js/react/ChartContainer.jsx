const React = require('react');
const ReactDOM = require('react-dom');
const ChartBaseView = require('../charts/ChartBaseView');

module.exports = React.createClass({
  mixins: [],

  shouldComponentUpdate() {
    // Let D3 scripts and bootstrap plugins manage the dom
    return false;
  },

  componentDidMount() {
    this.chartBaseView = new ChartBaseView(ReactDOM.findDOMNode(this.refs.sdgvSvg));
    // window.chartBaseView = this.chartBaseView;
  },

  render() {
    return (
      <div className="sdgv-svg-container">
        <svg id="sdgv-svg" className="sdgv-svg" ref="sdgvSvg" width="150" height="300"></svg>
      </div>
    );
  }
});