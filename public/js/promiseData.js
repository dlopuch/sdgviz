'use strict';

const Promise = require('bluebird');
const tabletop = require('tabletop');

const DOCS_URL = 'https://docs.google.com/spreadsheets/d/1h3RPu4a-wfeQi7ROcrWGwu_m-T4VB7_RHZQJjDfeIJ8/pub?gid=0&single=true&output=csv';
const DOCS_KEY = '1h3RPu4a-wfeQi7ROcrWGwu_m-T4VB7_RHZQJjDfeIJ8';

module.exports = new Promise(function(resolve, reject) {
  // Tabletop doesn't do error handling.  If timeout hits, assume the worst
  let timeoutHit = false;
  let timeout = setTimeout(function() {
    timeoutHit = true;
    reject(new Error('Timeout exceeded'));
  }, 5000);
  tabletop.init({
    key: DOCS_KEY,
    simpleSheet: true,
    callback: function(data, tabletop) {
      if (timeoutHit) {
        throw new Error('Uh-oh, too late.  Came back successfully, but timeout hit.');
      }

      clearTimeout(timeout);
      resolve(data);
    }
  });
});