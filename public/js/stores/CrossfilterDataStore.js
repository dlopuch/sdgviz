const _ = require('lodash');
const actions = require('../actions');
const d3 = require('d3');
const Reflux = require('reflux');
const promiseData = require('../promiseData');


const SDG_DEFS = {
  1:  { color: '#E6223D', name: 'No Poverty' },
  2:  { color: '#DEA73A', name: 'Zero Hunger' },
  3:  { color: '#4CA247', name: 'Good Health and Well-Being' },
  4:  { color: '#C72030', name: 'Quality Education' },
  5:  { color: '#EF402E', name: 'Gender Equality' },
  6:  { color: '#26BFE7', name: 'Clean Water and Sanitation' },
  7:  { color: '#FBC413', name: 'Affordable and Clean Energy' },
  8:  { color: '#A41C45', name: 'Decent Work and Economic Growth' },
  9:  { color: '#F26A2F', name: 'Industry, Innovation, and Infrastructure' },
  10: { color: '#DF1768', name: 'Reduced Inequalities' },
  11: { color: '#F89D2A', name: 'Sustainable Cities and Communities' },
  12: { color: '#C08E2D', name: 'Responsible Consumption and Production' },
  13: { color: '#3F7F45', name: 'Climate Action' },
  14: { color: '#1F97D5', name: 'Life Below Water' },
  15: { color: '#5ABA48', name: 'Life on Land' },
  16: { color: '#136A9F', name: 'Peace, Justice, and Strong Institutions' },
  17: { color: '#13496B', name: 'Partnership for the Goals' },
};

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
      dataXF => [{ key: 'all', value: dataXF.g.allAmount.value() }]
    );
  },

  onSelectXFByOrg() {
    this._processXf(
      'amountByOrg',
      // extractKV(xf):
      dataXF => Array.from(dataXF.g.orgsByAmount.all()).sort()
    );
  },

  onSelectXFBySdg() {
    this._processXf(
      'amountBySdg',
      // extractKV(xf):
      dataXF => {
        let kvs = Array.from(dataXF.g.sdgsByAmount.all()).sort(r => d3.ascending(r.key));

        // Now lets add in the SDG meta data
        kvs.forEach(kv => {
          kv.meta = !SDG_DEFS[kv.key] ? { error: `Unknown SDG: ${kv.key}` } : _.clone(SDG_DEFS[kv.key]);
        });

        return kvs;
      }
    );
  },

  _processXf(drilldownName, extractKV) {
    promiseData
      .error(e => console.error(`Error accessing data, data load error: ${e}`))
      .then(dataXF => {
        this.state.drilldownName = drilldownName;
        this.state.allAmount = dataXF.g.allAmount.value();
        this.state.drilldownKV = extractKV(dataXF); // list of {key: <category ID>, value: <number>}

        this.trigger(_.clone(this.state));
      });
  },
});
