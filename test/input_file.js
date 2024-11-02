// blah
"use strict";

const { TextDecoder, TextEncoder } = require(`util`)

import "node:fs/promises"
import "node:path"
import "node:process"
import "node:url"
import "./shared/rollup.js"
import "./shared/parseAst.js"
import loadConfigFile_js from "./shared/loadConfigFile.js"
import "node:tty"
import "node:path"
import "./native.js"
import "node:perf_hooks"
import "./getLogFilter.js"


// here
import "./sideeffect"
import "./input_file.js"
import "./input_file"
import { thing88 as t } from "./bundle-url"
import tt from "./bundle-url"
import {ttt} from "./bundle-url"
import { thing87 as tttt } from "./bundle-url"
import { thing87 as ttttt } from "./bundle-url"
export * from "./bundle-url"
export { thing } from "somewhere"
// here end

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
