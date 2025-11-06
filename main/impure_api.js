import { defaultNodeBuildinModuleNames, convertImports as pureConvertImports, escapeString } from "./common_api.js"
import { FileSystem, glob } from "https://deno.land/x/quickr@0.7.4/main/file_system.js"

export const requirePathToEcmaScriptPath = async (importPathString, pathToCurrentFile, {nodeBuildinModuleNames=defaultNodeBuildinModuleNames, convertWarning, quotesPreference}={})=>{
    let targetPath = FileSystem.normalize(importPathString)
    if (!FileSystem.isAbsolutePath(importPathString)) {
        targetPath = FileSystem.normalize(`${FileSystem.parentPath(pathToCurrentFile)}/${importPathString}`)
    }
    let importWarning = null
    if (nodeBuildinModuleNames.includes(importPathString)) {
        importPathString = `node:${importPathString}`
    } else {
        const isDefinitelyFilePath = importPathString.startsWith('./') || importPathString.startsWith('../') || importPathString.startsWith('/')
        const isHttpsUrl = importPathString.startsWith('https://') || importPathString.startsWith('http://')
        const isAlmostCertainlyNpm = !isDefinitelyFilePath && (importPathString.startsWith('@') || importPathString.includes('/') || importPathString.startsWith('npm:') || importPathString.startsWith('node:'))
        if (isHttpsUrl) {
            // nothing!
        } else if (isAlmostCertainlyNpm) {
            if (!importPathString.startsWith('npm:') && !importPathString.startsWith('node:')) {
                importPathString = `npm:${importPathString}`
            }
        } else {
            // this is for when the .js is given but doesn't exist but the .ts does
            if (targetPath.endsWith('.js')) {
                targetPath = targetPath.slice(0,-3)
                if (importPathString.endsWith('.js')) {
                    importPathString = importPathString.slice(0,-3)
                }
            }
            let [ main, js, ts, jsx, tsx ] = await Promise.all([
                FileSystem.info(`${targetPath}`),
                FileSystem.info(`${targetPath}.js`),
                FileSystem.info(`${targetPath}.ts`),
                FileSystem.info(`${targetPath}.jsx`),
                FileSystem.info(`${targetPath}.tsx`),
            ])
            if (js.exists) {
                importPathString = `${importPathString}.js`
            } else if (ts.exists) {
                importPathString = `${importPathString}.ts`
            } else if (jsx.exists) {
                importPathString = `${importPathString}.jsx`
            } else if (tsx.exists) {
                importPathString = `${importPathString}.tsx`
            } else if (main.isDirectory) {
                const items = await Promise.all([
                    FileSystem.info(`${targetPath}/index.js`),
                    FileSystem.info(`${targetPath}/index.ts`),
                    FileSystem.info(`${targetPath}/index.jsx`),
                    FileSystem.info(`${targetPath}/index.tsx`),
                    FileSystem.info(`${targetPath}/mod.js`),
                    FileSystem.info(`${targetPath}/mod.ts`),
                    FileSystem.info(`${targetPath}/mod.jsx`),
                    FileSystem.info(`${targetPath}/mod.tsx`),
                ])
                let oneMatched = false
                for (const each of items) {
                    if (each.exists) {
                        importPathString = `${importPathString}/${each.basename}`
                        oneMatched = true
                        break
                    }
                }
                if (!oneMatched) {
                    importWarning = `CHECKME: path is folder, but no index.js or index.ts or mod.js or mod.ts`
                }
            } else if (main.isFile) {
                importWarning = `CHECKME: path is file, but not js or ts`
            } else if (isDefinitelyFilePath) {
                if (importPathString.endsWith('.json')) {
                    importWarning = `CHECKME: importing json is not EcmaScript`
                } else if (importPathString.endsWith('.wasm')) {
                    importWarning = `CHECKME: importing wasm is not EcmaScript (yet)`
                } else {
                    importWarning = `CHECKME: file(s) didn't exist`
                }
            } else {
                importWarning = `CHECKME: file(s) didn't exist, assuming npm`
                importPathString = `npm:${importPathString}`
            }
        }
    }
    let importPathCode = escapeString(importPathString, quotesPreference)
    if (importWarning) {
        const importPathCodeWithWarning = `${importPathCode} /* ${importWarning} */`
        if (convertWarning) {
            importPathCode = (await convertWarning(importPathString, { importWarning, pathToCurrentFile, quotesPreference })) || importPathCodeWithWarning
        } else {
            importPathCode = importPathCodeWithWarning
        }
    }
    return importPathCode
}

/**
 * file string with require() to file string with import()
 *
 * @example
 * ```js
 * import { convertImports } from "https://deno.land/x/to_esm/main/impure_api.js"
 * console.log(
 *     convertImports({
 *         fileContent: `
 *             const { a } = require("b")
 *             const { c } = require("d")
 *         `,
 *         path: "path/of/those/contents.js",
 *         customConverter: (importPathString) => {
 *             if (importPathString === "b") {
 *                 return JSON.stringify("https://deno.land/x/a@1.2.3/mod.js") + "// CHECKME "
 *             } if (importPathString.startsWith("npm:")) {
 *                 return JSON.stringify("https://esm.sh/${importPathString.slice(4)}")
 *             }
 *         },
 *         handleUnhandlable: (requireArgs, statementText, statement) => {
 *             // if the require args are "b" or 'b'
 *             if (requireArgs.match(/("|')b(\1)/)) {
 *                 return `import { a } from "https://deno.land/x/a@1.2.3/mod.js" // CHECKME `
 *             }
 *         },
 *     }),
 * )
 * ```
 *
 * @param {string} arg1.fileContent  - the string content of the file
 * @param {string} arg1.path  - the path (theoretically) to file content
 * @param {Function|null} arg1.customConverter  - a function which takes a string(import) and returns either null(no change) or a string(new import)
 * @param {Function|null} arg1.convertWarning - a function which take a string(import) and return null(no change) or a string(new import) but only gets called if the normal handler is unsure about the conversion
 * @param {Function|null} arg1.handleUnhandlable  - a function, takes requireArgs, statementText, & statement(Node) and returns the replacement of the statement or null(no change)
 * @param {string} arg1.defaultExtension  - the default extension to use if none is provided
 * @param {string[]} arg1.nodeBuildinModuleNames  - probably not needed, but if whats builtin changes, this is were to add it
 * @returns {Promise<string>} output - the converted file content
 *
 */
export function convertImports(arg) {
    // just set on argument
    arg.requirePathToEcmaScriptPath = requirePathToEcmaScriptPath
    return pureConvertImports(arg)
}

/**
 * file string with require() to file string with import()
 *
 * @example
 * ```js
 * import { toEsm } from "https://deno.land/x/to_esm/main/impure_api.js"
 * console.log(
 *     toEsm({
 *         path: "some_file.ts",
 *         customConverter: (importPathString) => {
 *             if (importPathString === "b") {
 *                 return "https://deno.land/x/a@1.2.3/mod.js"
 *             } if (importPathString.startsWith("npm:")) {
 *                 return "https://esm.sh/${importPathString.slice(4)}"
 *             }
 *         },
 *         handleUnhandlable: (requireArgs, statementText, statement) => {
 *             // if the require args are "b" or 'b'
 *             if (requireArgs.match(/("|')b(\1)/)) {
 *                 return `import { a } from "https://deno.land/x/a@1.2.3/mod.js" // CHECKME `
 *             }
 *         },
 *     }),
 * )
 * ```
 *
 * @param {string} arg1.path  - the path (theoretically) to file content
 * @param {Function|null} arg1.customConverter  - the list of functions, which take a string(import) and return null(no change) or a string(new import)
 * @param {Function|null} arg1.handleUnhandlable  - a function, takes requireArgs, statementText, & statement(Node) and returns the replacement of the statement or null(no change)
 * @param {string[]} arg1.nodeBuildinModuleNames - probably not needed, but if npm builtins change, this is were to add that change
 * @returns {string} output - the converted file content
 *
 */
export const toEsm = async ({path, nodeBuildinModuleNames=defaultNodeBuildinModuleNames, customConverter=null, handleUnhandlable=null, convertWarning=null})=>convertImports({fileContent: await FileSystem.read(path), path, nodeBuildinModuleNames, customConverter, handleUnhandlable, convertWarning})