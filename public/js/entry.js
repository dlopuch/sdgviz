const content = require('./content.js');
const promiseData = require('./promiseData');

window.onload = function onload() {
  document.getElementById('content_div').innerHTML = `yo dan! ${content}`;

  console.log('not so fast, FIXME: linting violation no semicolon');

  promiseData.then(function(data) {
    console.log('GOT DATA!', data);
    window.hdData = data;
  });
};
