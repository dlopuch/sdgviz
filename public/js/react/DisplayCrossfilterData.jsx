const React = require('react');
const Reflux = require('reflux');

const CrossfilterDataStore = require('../stores/CrossfilterDataStore');

module.exports = React.createClass({
  mixins: [
    Reflux.connect(CrossfilterDataStore, 'xfData')
  ],

  getInitialState: function() {
    return {
      xfData: null
    };
  },

  render: function() {
    if (!this.state.xfData) {
      return (<div>No data selected</div>);
    }

    return (
      <div>
        <p>
          All amount: {this.state.xfData.allAmount}
        </p>
        <div>
          KV's:
          <table>
            <tbody>
              { this.state.xfData.drilldownKV.map(kv => (
                <tr key={kv.key}>
                  <td>{kv.key}</td>
                  <td>{kv.value}</td>
                </tr>
              )) }
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});