const _ = require('lodash');
const actions = require('../actions');
const d3 = require('d3');
const Reflux = require('reflux');
const promiseData = require('../promiseData');


module.exports = Reflux.createStore({
  init() {
    this.listenToMany({
      onSelectXFAllAmount: actions.selectDrilldown.allAmount,
      onSelectXFByOrg    : actions.selectDrilldown.amountByOrg,
      onSelectXFBySdg    : actions.selectDrilldown.amountBySdg,
    });

    this.state = {
      goal: 500000000,
      drilldownName: null,
      allAmount: null,
      drilldownKV: null,
    };
  },

  onSelectXFAllAmount() {
    this._processXf(
      'allAmount',
      // extractKV(xf):
      dataXF => [{ key: 'all', value: dataXF.views.allAmount }]
    );
  },

  onSelectXFByOrg() {
    this._processXf(
      'amountByOrg',
      // extractKV(xf):
      dataXF => Array.from(dataXF.views.amountByOrgBySdg).sort((r1, r2) => d3.descending(r1.value, r2.value))
    );
  },

  onSelectXFBySdg() {
    this._processXf(
      'amountBySdg',
      // extractKV(xf):
      dataXF => Array.from(dataXF.views.amountBySdgByOrg).sort((r1, r2) => d3.ascending(r1.key, r2.key))
    );
  },

  _processXf(drilldownName, extractKV) {
    promiseData
      .error(e => console.error(`Error accessing data, data load error: ${e}`))
      .then(dataXF => {
        this.state.drilldownName = drilldownName;
        this.state.allAmount = dataXF.views.allAmount;
        this.state.drilldownKV = extractKV(dataXF); // list of {key: <category ID>, value: <number>}

        this.trigger(_.clone(this.state));
      });
  },
});
