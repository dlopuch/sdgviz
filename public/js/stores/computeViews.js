const _ = require('lodash');

function computeAmountBySdgByOrg(data, allViews) {
  let amountBySdgByOrg = _.cloneDeep(allViews.amountBySdg);

  _(allViews.amountBySdg).map(kvObj => kvObj.key).forEach((sdg, i) => {
    // Set the crossfilter to the current sdg
    data.d.sdg.filter(sdg);

    // Get the top contributing orgs
    amountBySdgByOrg[i].drilldown = _.cloneDeep(data.g.orgsByAmount.top(Infinity).filter(kvObj => kvObj.value > 0));
  });

  // Clear crossfilter state
  data.d.sdg.filterAll();

  return amountBySdgByOrg;
}

function computeAmountByOrgBySdg(data, allViews) {
  let amountByOrgBySdg = _.cloneDeep(allViews.amountByOrg);

  _(allViews.amountByOrg).map(kvObj => kvObj.key).forEach((org, i) => {
    // Set the crossfilter to the current sdg
    data.d.org.filter(org);

    // Get the top contributing orgs
    amountByOrgBySdg[i].drilldown = _.cloneDeep(data.g.sdgsByAmount.top(Infinity).filter(kvObj => kvObj.value > 0));
  });

  // Clear crossfilter state
  data.d.org.filterAll();

  return amountByOrgBySdg;
}

module.exports = function(data) {
  /* data comes from promiseData and looks like:
      {
        records: data,
        crossfilter: xData,

        d: dimensions,
        g: groups,
      };
  */
  let views = {
    // Crossfilter mutates all it's outputs, so need to cloneDeep() everything to avoid values changing out from
    // under us when we modify the state of the crossfilter.
    allAmount: _.clone(data.g.allAmount.value()),
    amountBySdg: _.cloneDeep(data.g.sdgsByAmount.all()), // list of {key: sdg, value: amount}
    amountByOrg: _.cloneDeep(data.g.orgsByAmount.all()), // list of {key: org, value: amount}
  };

  views.amountBySdgByOrg = computeAmountBySdgByOrg(data, views);
  views.amountByOrgBySdg = computeAmountByOrgBySdg(data, views);

  return views;
};
