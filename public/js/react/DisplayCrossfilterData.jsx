const React = require('react');
const Reflux = require('reflux');

const actions = require('../actions');
const CrossfilterDataStore = require('../stores/CrossfilterDataStore');
const InteractionStore = require('../stores/InteractionStore');
const F = require('../Formatters');

module.exports = React.createClass({
  mixins: [
    Reflux.listenTo(CrossfilterDataStore, '_onXfData'),
    Reflux.listenTo(InteractionStore, '_onInteractionData'),
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

  _onInteractionData(data) {
    this.setState({
      hoverSelectKey: data.currentHoverKey,
    });

    if (data.clickedDrilldown) {
      let which = data.clickedDrilldown.key;
      this.state.activeDrilldowns[which] =
        data.clickedDrilldown.expand !== null ? data.clickedDrilldown.expand : !this.state.activeDrilldowns[which];
      this.forceUpdate();
    }
  },

  expandDrilldown(kvRecord) {
    // TODO: Migrate this to trigger the action and read from InteractionStore.clickedDrilldown
    this.state.activeDrilldowns[kvRecord.key] = true;
    this.forceUpdate();
  },

  hideDrilldown(kvRecord) {
    // TODO: Migrate this to trigger the action and read from InteractionStore.clickedDrilldown
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
        actions.interactions.hoverDrilldown(kv.key);
      };

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
      <tbody
        onMouseOut={() => actions.interactions.hoverDrilldown(null)}
      >
        {rows}
      </tbody>
    );
  },

  renderDrilldown() {
    let xfData = this.state.xfData;

    if (xfData.drilldownName === 'allAmount') {
      return (<div>
        Total pledged across all SDG's: <strong>{F.pledge(xfData.allAmount)}</strong><br/>
        That's <strong>{F.percent(xfData.allAmount / xfData.goal)}</strong> of the Half Billion Challenge!
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
              <td className="value" colspan="2">{F.pledge(this.state.xfData.allAmount)}</td>
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
            <td colSpan="2">Amount Pledged</td>
          </tr>
          </thead>
          { this.renderTableBodyWithDrilldowns(sdgKv => this.renderSdgFullName(false, sdgKv)) }
          <tfoot>
          <tr className="all-summary">
            <td className="key">All Pledges:</td>
            <td className="value" colspan="2">{F.pledge(this.state.xfData.allAmount)}</td>
            </tr>
          </tfoot>
        </table>
      );
    }
  },

  renderSdgFullName(small, sdgKvRecord) {
    let SIZE_PX = small ? 40 : 50;
    return (
      <div>
        <div
          style={{
            display: 'inline-block',
            width: SIZE_PX,
            height: SIZE_PX,
            margin: small ? 2 : 5,
            padding: 0,
            borderRadius: 5,

            background: `url(${sdgKvRecord.meta.iconUri}) no-repeat`,
            backgroundColor: sdgKvRecord.meta.color,
            backgroundSize: `${SIZE_PX}px ${SIZE_PX}px`,


            textAlign: 'center',
            color: 'white',
            fontWeight: 'bold',
            float: 'left',
          }}
          title={`SDG ${sdgKvRecord.key}: ${sdgKvRecord.meta.name}`}
        >
          &nbsp;&nbsp;
        </div>
        {sdgKvRecord.meta.name}
      </div>
    )
  },

  render: function() {
    if (!this.state.xfData) {
      return (<div className="sdgviz-drilldown">Loading pledge data, please wait...</div>);
    }

    return (
      <div className="sdgviz-drilldown">
        {this.renderDrilldown()}
      </div>
    );
  }
});