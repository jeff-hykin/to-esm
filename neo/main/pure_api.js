import { defaultNodeBuildinModuleNames, convertImportsBuilder } from "./common_api.js"

export const requirePathToEcmaScriptPath = async (importPathString, pathToCurrentFile, { defaultExtension = ".js", nodeBuildinModuleNames = defaultNodeBuildinModuleNames } = {}) => {
    let importWarning = null
    if (nodeBuildinModuleNames.includes(importPathString)) {
        importPathString = `node:${importPathString}`
    } else if (!(importPathString.endsWith(".js") || importPathString.endsWith(".ts"))) {
        const isDefinitelyFilePath = importPathString.startsWith("./") || importPathString.startsWith("../") || importPathString.startsWith("/")
        const isHttpsUrl = importPathString.startsWith("https://") || importPathString.startsWith("http://")
        const isAlmostCertainlyNpm = !isDefinitelyFilePath && (importPathString.startsWith("@") || importPathString.includes("/") || importPathString.startsWith("npm:") || importPathString.startsWith("node:"))
        if (isHttpsUrl) {
            // nothing!
        } else if (isAlmostCertainlyNpm) {
            if (!importPathString.startsWith("npm:") && !importPathString.startsWith("node:")) {
                importPathString = `npm:${importPathString}`
            }
        } else {
            if (importPathString.endsWith(".json")) {
                importWarning = `CHECKME: importing json is not EcmaScript`
            } else if (importPathString.endsWith(".wasm")) {
                importWarning = `CHECKME: importing wasm is not EcmaScript (yet)`
            } else if (importPathString.match(/\.\w+$/)) {
                importWarning = `CHECKME: seems like a non javascript file`
            } else if (isDefinitelyFilePath) {
                importPathString += defaultExtension
            } else {
                importWarning = `CHECKME: unclear if file import, assuming npm`
                importPathString = `npm:${importPathString}`
            }
        }
    }
    importPathString = JSON.stringify(importPathString)
    if (importWarning) {
        importPathString = `${importPathString} /* ${importWarning} */`
    }
    return importPathString
}

const converter = convertImportsBuilder(requirePathToEcmaScriptPath)

/**
 * file string with require() to file string with import()
 *
 * @example
 * ```js
 * import { convertImports } from "https://deno.land/x/to_esm/main/pure_api.js"
 * console.log(
 *     convertImports({
 *         fileContent: `
 *             const { a } = require("b")
 *             const { c } = require("d")
 *         `,
 *         path: "path/of/those/contents.js",
 *         customConverter: (importPathString) => {
 *             if (importPathString === "b") {
 *                 return JSON.stringify("https://deno.land/x/a@1.2.3/mod.js")+" // CHECKME "
 *             } if (importPathString.startsWith("npm:")) {
 *                 return JSON.stringify("https://esm.sh/${importPathString.slice(4)}")
 *             }
 *         },
 *     }),
 * )
 * ```
 *
 * @param {string} arg1.fileContent  - the string content of the file
 * @param {string} arg1.path  - the path (theoretically) to file content
 * @param {Function|null} arg1.customConverter  - the list of functions, which take a string(import) and return null(no change) or a string(new import)
 * @param {Function|null} arg1.handleUnhandlable  - a function, takes requireArgs, statementText, & statement(Node) and returns the replacement of the statement or null(no change)
 * @param {string} arg1.defaultExtension  - the default extension to use if none is provided
 * @param {string[]} arg1.nodeBuildinModuleNames  - probably not needed, but if whats builtin changes, this is were to add it
 * @returns {string} output - the converted file content
 *
 */
export const convertImports = ({ fileContent, path, nodeBuildinModuleNames = defaultNodeBuildinModuleNames, defaultExtension = ".js", customConverter = null, handleUnhandlable = null, convertWarning = null }) => converter({ fileContent, path, nodeBuildinModuleNames, defaultExtension, customConverter, handleUnhandlable, convertWarning })