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

  renderDrilldown() {
    let xfData = this.state.xfData;

    if (xfData.drilldownName === 'allAmount') {
      return (<div>
        Total pledged: {xfData.allAmount}.<br/>
        That's {xfData.allAmount / xfData.goal}% achieved!
      </div>);

    } else if (xfData.drilldownName === 'amountByOrg') {
      return (
        <table>
          <thead>
          <tr>
            <td>Organization</td>
            <td>Amount Pledged</td>
          </tr>
          </thead>
          <tbody>
          { xfData.drilldownKV.map(kv => (
            <tr key={kv.key}>
              <td>{kv.key}</td>
              <td>{kv.value}</td>
            </tr>
          )) }
          </tbody>
          <tfoot>
            <tr>
              <td>Total:</td>
              <td>{this.state.xfData.allAmount}</td>
            </tr>
          </tfoot>
        </table>
      );

    }  else if (xfData.drilldownName === 'amountBySdg') {
      return (
        <table>
          <thead>
          <tr>
            <td>SDG</td>
            <td>Amount Pledged</td>
          </tr>
          </thead>
          <tbody>
          { xfData.drilldownKV.map(kv => (
            <tr key={kv.key}>
              <td>
                <div style={{
                  display: 'inline-block',
                  width: 20,
                  height: 20,
                  margin: 5,
                  padding: 5,
                  borderRadius: 5,
                  backgroundColor: kv.meta.color,
                  textAlign: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                }}>
                  {kv.key}
                </div>
                {kv.meta.name}
              </td>
              <td>{kv.value}</td>
            </tr>
          )) }
          </tbody>
          <tfoot>
            <tr>
              <td>Total:</td>
              <td>{this.state.xfData.allAmount}</td>
            </tr>
          </tfoot>
        </table>
      );
    }
  },

  render: function() {
    if (!this.state.xfData) {
      return (<div className="sdgviz-drilldown">Loading, please wait...</div>);
    }

    return (
      <div className="sdgviz-drilldown">
        {this.renderDrilldown()}
      </div>
    );
  }
});