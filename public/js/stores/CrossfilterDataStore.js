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
      allAmount: null,
      drilldownKV: null,
    };
  },

  onSelectXFAllAmount() {
    this._processXf(
      // extractKV(xf):
      dataXF => [{ key: 'all', value: dataXF.g.allAmount.value() }]
    );
  },

  onSelectXFByOrg() {
    this._processXf(
      // extractKV(xf):
      dataXF => dataXF.g.orgsByAmount.all().sort()
    );
  },

  onSelectXFBySdg() {
    this._processXf(
      // extractKV(xf):
      dataXF => dataXF.g.sdgsByAmount.all().sort(r => d3.ascending(r.key))
    );
  },

  _processXf(extractKV) {
    promiseData
      .error(e => console.error(`Error accessing data, data load error: ${e}`))
      .then(dataXF => {
        this.state.allAmount = dataXF.g.allAmount.value();
        this.state.drilldownKV = extractKV(dataXF); // list of {key: <category ID>, value: <number>}

        this.trigger(_.clone(this.state));
      });
  },
});
