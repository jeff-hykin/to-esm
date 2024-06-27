// blah
"use strict";
exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;

require('./sideeffect')
function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)\/[^/]+$/, '$1') + '/';
}

var cantHandle1 = require('./bundle-url').thing57.thing58;
var canHandle1 = require('./bundle-url').thing57;
var canHandle2 = require('./bundle-url').default;
var {canHandle3} = require('./bundle-url').default;
var {canHandle4} = require('./bundle-url').thing67;
const {canHandle4} = require('./bundle-url').thing67;
{{{{{{
    var canHandle2 = require('./bundle-url');
}}}}}}
var varBundle = require('./bundle-url');
let letBundle = require('./bundle-url');
const constBundle = require('./bundle-url');

var { thing99 } = require('input_file.js');
var { thing4 } = require('input_file');
var { thing4: renameded } = require('other-thingy/somewhere');
let { thing } = require('other-thingy/somewhere');
let { thing2: renamedThing } = require('other-thingy/somewhere');

hello.thing
hello.thing.thingy
module.exports = {}
