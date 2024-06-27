"use strict";module = module||{};module.exports=module.exports||{};
// blah
"use strict";
exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;

import "./sideeffect" /* CHECKME: file(s) didn't exist */
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

var cantHandle1 = require('./bundle-url')/* FIXME: can auto handle deep require (await import('./bundle-url')) */.thing57.thing58;
import { thing57 as canHandle1 } from "./bundle-url" /* CHECKME: file(s) didn't exist */
import canHandle2 from "./bundle-url" /* CHECKME: file(s) didn't exist */
import {canHandle3} from "./bundle-url" /* CHECKME: file(s) didn't exist */
import { thing67 as tempVar$dqube5rnbt7 } from "./bundle-url" /* CHECKME: file(s) didn't exist */; var {canHandle4} = tempVar$dqube5rnbt7
import { thing67 as tempVar$zz33raqtd2r } from "./bundle-url" /* CHECKME: file(s) didn't exist */; var {canHandle4} = tempVar$zz33raqtd2r
{{{{{{
    var canHandle2 = require('./bundle-url')/* FIXME: can auto handle deep require (await import('./bundle-url')) */;
}}}}}}
import varBundle from "./bundle-url" /* CHECKME: file(s) didn't exist */
import letBundle from "./bundle-url" /* CHECKME: file(s) didn't exist */
import constBundle from "./bundle-url" /* CHECKME: file(s) didn't exist */

import { thing99 } from "input_file.js"
import { thing4 } from "input_file.js"
import { thing4 as  renameded } from "npm:other-thingy/somewhere"
import { thing } from "npm:other-thingy/somewhere"
import { thing2 as  renamedThing } from "npm:other-thingy/somewhere"

hello.thing
hello.thing.thingy
module.exports = {}

;export default module.exports