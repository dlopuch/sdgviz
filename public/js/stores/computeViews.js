const _ = require('lodash');
const d3 = require('d3');

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

/**
 * Creates a D3-like scale constructor that when set with a domain of ordinals (intended:
 * organization names), the scale returns a color using the d3.interpolateCool() scale.
 * @returns {orgScale} a d3-scale-like object that you can call .domain() on.
 */
const scaleOrgColor = function() {
  let scale = d3.scaleOrdinal();

  let orgScale = function(org) {
    return d3.interpolateCool(scale(org));
  };

  orgScale.domain = function(domainList) {
    scale.domain(domainList);

    if (!domainList.length) {
      scale.range([]);
    } else if (domainList.length === 1) {
      scale.range([0]);
    } else {
      // make range 0 - 1, with length === domainList.length
      scale.range(d3.range(0, 1 + 1 / domainList.length, 1 / (domainList.length - 1)));
    }

    return this;
  };

  return orgScale;
};

function getMetaForSdg(sdg) {
  if (!SDG_DEFS[sdg]) {
    console.warn(new Error(`Unknown SDG: ${sdg}`));
    return { error: `Unknown SDG: ${sdg}`, color: '#000' };
  }

  return SDG_DEFS[sdg];
}

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


  // Post-processing: inject SDG meta to all SDG records
  let injectSdgMeta = sdgRecord => sdgRecord.meta = getMetaForSdg(sdgRecord.key);
  views.amountBySdg.forEach(injectSdgMeta);
  views.amountBySdgByOrg.forEach(injectSdgMeta);
  views.amountByOrgBySdg.forEach(org => org.drilldown.forEach(injectSdgMeta));


  // Post-processing: inject org metadata to all org records
  let orgScale = scaleOrgColor();
  let orgs = _(views.amountByOrg).sort().reverse().map(kvObj => kvObj.key).value();
  orgScale.domain(orgs);

  let orgMetaByOrg = {};
  orgs.forEach(org => orgMetaByOrg[org] = { color: orgScale(org) });

  let injectOrgMeta = orgRecord => orgRecord.meta = orgMetaByOrg[orgRecord.key];
  views.amountByOrg.forEach(injectOrgMeta);
  views.amountByOrgBySdg.forEach(injectOrgMeta);
  views.amountBySdgByOrg.forEach(sdg => sdg.drilldown.forEach(injectOrgMeta));

  return views;
};
