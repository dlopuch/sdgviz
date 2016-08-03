/**
 * Grabs the data from the google spreadsheet and returns it as a crossfilter configured for various
 * slice-and-dices.
 */

const Promise = require('bluebird');
const tabletop = require('tabletop');
const crossfilter = require('crossfilter');

// const DOCS_URL = 'https://docs.google.com/spreadsheets/d/1h3RPu4a-wfeQi7ROcrWGwu_m-T4VB7_RHZQJjDfeIJ8/pub?gid=0&single=true&output=csv';
const DOCS_KEY = '1h3RPu4a-wfeQi7ROcrWGwu_m-T4VB7_RHZQJjDfeIJ8';

function promiseFetchData() {
  return new Promise((resolve, reject) => {
    // Tabletop doesn't do error handling.  If timeout hits, assume the worst
    let timeoutHit = false;
    const timeout = setTimeout(() => {
      timeoutHit = true;
      reject(new Error('Timeout exceeded'));
    }, 5000);
    tabletop.init({
      key: DOCS_KEY,
      simpleSheet: true,
      callback(data) {
        if (timeoutHit) {
          throw new Error('Uh-oh, too late.  Came back successfully, but timeout hit.');
        }

        if (!data) {
          return reject(new Error('Missing data!'));
        }

        if (!Array.isArray(data)) {
          return reject(new Error(`spreadsheet data not an array: ${JSON.stringify(data)}`));
        }

        clearTimeout(timeout);

        resolve(data);
      },
    });
  });
}

module.exports = promiseFetchData()

.then(function transformData(data) {
  // transform data: strings to int
  return data.map(d => ({
    organization: d.organization,
    sdg: parseInt(d.sdg, 10),
    amount: parseInt(d.amount, 10),
    country: d.country,
  }));
})

/**
 * ...And turn into crossfilter
 *
 * Example usages:
 *   data.g.allAmount.value()
 *   data.g.sdgsByAmount.all()
 *   data.g.orgsByAmount.top(3)
 */
.then(function crossfilterify(data) {
  const xData = crossfilter(data);

  const dimensions = {
    org: xData.dimension(r => r.organization),
    sdg: xData.dimension(r => r.sdg),
    amount: xData.dimension(r => r.amount),
    country: xData.dimension(r => r.country),
  };

  const groups = {
    // All records by sum of amount
    allAmount: xData.groupAll().reduceSum(r => r.amount),

    orgsByAmount: dimensions.org.group().reduceSum(r => r.amount),
    sdgsByAmount: dimensions.sdg.group().reduceSum(r => r.amount),
    countriesByAmount: dimensions.country.group().reduceSum(r => r.amount),

    // TODO: perhaps amounts by log group? eg 3 10,000, 6 100,0000, 1 1,000,000
  };

  return {
    records: data,
    crossfilter: xData,

    d: dimensions,
    g: groups,
  };
});
