"use strict";module = module||{};module.exports=module.exports||{};
// blah
"use strict";

// here
import "./sideeffect" /* CHECKME: file(s) didn't exist */
import "./input_file.js"
import "./input_file.js"
import { thing88 as t } from "./bundle-url" /* CHECKME: file(s) didn't exist */
import tt from "./bundle-url" /* CHECKME: file(s) didn't exist */
import {ttt} from "./bundle-url" /* CHECKME: file(s) didn't exist */
import { thing87 as tttt } from "./bundle-url" /* CHECKME: file(s) didn't exist */
import { thing87 as ttttt } from "./bundle-url" /* CHECKME: file(s) didn't exist */
export * from "./bundle-url" /* CHECKME: file(s) didn't exist */
export { thing } from "somewhere" /* CHECKME: file(s) didn't exist, assuming npm */
// here end

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
import { thing67 as tempVar$td6tcdsi62 } from "./bundle-url" /* CHECKME: file(s) didn't exist */; var {canHandle4} = tempVar$td6tcdsi62
import { thing67 as tempVar$2yccrmruw7d } from "./bundle-url" /* CHECKME: file(s) didn't exist */; var {canHandle4} = tempVar$2yccrmruw7d
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