const d3 = require('d3');

module.exports = {
  percent: d3.format('.0%'),
  pledge: n => `$ ${d3.format('.3s')(n)}`, // d3 (un)helpfully localized currency, so string concat
  tick: n => `$ ${d3.format('.3s')(n)}`,

  colors: {
    // Also change in style.less
    gscBlue: '#01589b',
    gscLightBlue: '#9dbed8',
  },
};
