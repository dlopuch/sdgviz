const React = require('react');
const Reflux = require('reflux');

const CrossfilterDataStore = require('../stores/CrossfilterDataStore');
const F = require('../Formatters');

module.exports = React.createClass({
  mixins: [
    Reflux.listenTo(CrossfilterDataStore, '_onXfData')
  ],

  getInitialState() {
    return {
      xfData: null,
      activeDrilldowns: {},
      hoverSelectKey: null,
    };
  },

  _onXfData(data) {
    this.setState({
      xfData: data,
      activeDrilldowns: {},
      hoverSelectKey: null,
    });
  },

  expandDrilldown(kvRecord) {
    this.state.activeDrilldowns[kvRecord.key] = true;
    this.forceUpdate();
  },

  hideDrilldown(kvRecord) {
    this.state.activeDrilldowns[kvRecord.key] = false;
    this.forceUpdate();
  },

  renderTableBodyWithDrilldowns(renderTopKey, renderDrilldownKey) {
    if (!renderTopKey) {
      renderTopKey = kv => kv.key;
    }

    if (!renderDrilldownKey) {
      renderDrilldownKey = kv => kv.key;
    }

    let rows = [];

    this.state.xfData.drilldownKV.forEach(kv => {
      let onHoverRow = () => {
        this.setState({ hoverSelectKey: kv.key });
      }

      if (!this.state.activeDrilldowns[kv.key]) {
        rows.push(
          (<tr className={"top-record collapsed" + (this.state.hoverSelectKey === kv.key ? " hovered" : "")}
               onMouseOver={onHoverRow}
               onClick={this.expandDrilldown.bind(this, kv)}
               key={kv.key}
          >
            <td className="key">{renderTopKey(kv)}</td>
            <td className="value">{F.pledge(kv.value)}</td>
            <td className="top-record-do-expand">&#x25BC;</td>
          </tr>)
        );
        return;
      }

      rows.push(
        (<tr className={"top-record expanded" + (this.state.hoverSelectKey === kv.key ? " hovered" : "")}
             onMouseOver={onHoverRow}
             onClick={this.hideDrilldown.bind(this, kv)}
             key={kv.key}
        >
          <td className="key">{renderTopKey(kv)}</td>
          <td></td>
          <td className="top-record-do-expand">&#x25B2;</td>
        </tr>)
      );

      kv.drilldown.forEach((drilldownKV, i, allDrilldowns) => {
        rows.push(
          (<tr className={"drilldown-record" + (this.state.hoverSelectKey === kv.key ? " hovered" : "")}
               onMouseOver={onHoverRow}
               key={kv.key + '__' + drilldownKV.key}
          >
            <td className="key">
              <div className="tree-marker">
                {i === allDrilldowns.length - 1 ? '└' : '├' }
              </div>
              <div className="tree-contents">
                {renderDrilldownKey(drilldownKV)}
              </div>
            </td>
            <td className="value"> {F.pledge(drilldownKV.value)} </td>
            <td></td>
          </tr>)
        );
      });

      rows.push(
        (<tr className={"drilldown-summary-record" + (this.state.hoverSelectKey === kv.key ? " hovered" : "")}
             onMouseOver={onHoverRow}
             key={kv.key + "__@drilldownSummary"}
        >
          <td className="key">Total:</td>
          <td className="value"> {F.pledge(kv.value)} </td>
          <td></td>
        </tr>)
      )
    })

    return (
      <tbody onMouseOut={this.setState.bind(this, { hoverSelectKey: null }, null)}>
        {rows}
      </tbody>
    );
  },

  renderDrilldown() {
    let xfData = this.state.xfData;

    if (xfData.drilldownName === 'allAmount') {
      return (<div>
        Total pledged: {F.pledge(xfData.allAmount)}.<br/>
        That's {F.percent(xfData.allAmount / xfData.goal)} achieved!
      </div>);

    } else if (xfData.drilldownName === 'amountByOrg') {
      return (
        <table className="sdgviz-table by-org">
          <thead>
          <tr>
            <td>Organization</td>
            <td colSpan="2">Amount Pledged</td>
          </tr>
          </thead>
          { this.renderTableBodyWithDrilldowns(null, sdgKv => this.renderSdgFullName(true, sdgKv)) }
          <tfoot>
            <tr className="all-summary">
              <td className="key">All Pledges:</td>
              <td className="value">{F.pledge(this.state.xfData.allAmount)}</td>
            </tr>
          </tfoot>
        </table>
      );

    }  else if (xfData.drilldownName === 'amountBySdg') {
      return (
        <table className="sdgviz-table by-sdg">
          <thead>
          <tr>
            <td>SDG</td>
            <td>Amount Pledged</td>
          </tr>
          </thead>
          { this.renderTableBodyWithDrilldowns(sdgKv => this.renderSdgFullName(false, sdgKv)) }
          <tfoot>
          <tr className="all-summary">
            <td className="key">All Pledges:</td>
            <td className="value">{F.pledge(this.state.xfData.allAmount)}</td>
            </tr>
          </tfoot>
        </table>
      );
    }
  },

  renderSdgFullName(small, sdgKvRecord) {
    return (
      <div>
        <div style={{
          display: 'inline-block',
          width: 20,
          height: 20,
          margin: small ? 2 : 5,
          padding: small ? 2 : 5,
          borderRadius: 5,
          backgroundColor: sdgKvRecord.meta.color,
          textAlign: 'center',
          color: 'white',
          fontWeight: 'bold',
        }}>
          {sdgKvRecord.key}
        </div>
        {sdgKvRecord.meta.name}
      </div>
    )
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