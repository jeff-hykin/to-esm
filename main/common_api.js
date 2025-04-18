import { parserFromWasm, xmlStylePreview, flatNodeList } from "https://deno.land/x/deno_tree_sitter@0.2.6.0/main.js"
// import { parserFromWasm, xmlStylePreview } from "/Users/jeffhykin/repos/deno-tree-sitter/main.js"
import javascript from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/4d8a6d34d7f6263ff570f333cdcf5ded6be89e3d/main/javascript.js"
const parser = await parserFromWasm(javascript) // path or Uint8Array
import { capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingKebabCase, toScreamingSnakeCase, toRepresentation, toString, regex, findAll, iterativelyFindAll, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier, removeCommonPrefix } from "https://deno.land/x/good@1.13.0.1/string.js"
import { escapeStringAsJsSingleQuotes } from "https://esm.sh/gh/jeff-hykin/good-js@1.16.2.0/source/flattened/escape_string_as_js_single_quotes.js"

export const escapeString = (string, quotesPreference="double")=>{
    if (quotesPreference === "double") {
        return JSON.stringify(string)
    } else if (quotesPreference === "single") {
        return escapeStringAsJsSingleQuotes(string)
    } else {
        throw Error(`quotesPreference was ${quotesPreference}, but it should be double or single`)
    }
}
export const defaultNodeBuildinModuleNames = [
    "assert",
    "buffer",
    "child_process",
    "cluster",
    "crypto",
    "dgram",
    "dns",
    "domain",
    "events",
    "fs",
    "http",
    "https",
    "net",
    "os",
    "path",
    "punycode",
    "querystring",
    "readline",
    "stream",
    "string_decoder",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "v8",
    "vm",
    "zlib",
    "module",
    "fs/promises",
    "perf_hooks",
    "process",
    "worker_threads",
]

export function isStaticTemplateString(text) {
    return !!text.match(/^`(?:\\\$|\\[^\$]|\$(?=[^\{])|[^\$`\\])*`$/)
}

/**
 * file string with require() to file string with import()
 *
 * @example
 * ```js
 * import { convertImports, escapeString } from "https://deno.land/x/to_esm/main/common_api.js"
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
 *         requirePathToEcmaScriptPath: async (importPathString, pathToCurrentFile, {nodeBuildinModuleNames, convertWarning, quotesPreference}={})=>{
 *            // importPathString is the unquoted argument given to require() (guaranteed to be a string)
 *            return escapeString(importPathString, quotesPreference) + "// CHECKME "
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
 * @param {string[]} arg1.
 * @returns {Promise<string>} output - the converted file content
 *
 */
export async function convertImports({fileContent, path, nodeBuildinModuleNames=defaultNodeBuildinModuleNames, defaultExtension=".js", customConverter=null, handleUnhandlable=()=>null, convertWarning=null, quotesPreference="double", requirePathToEcmaScriptPath}) {
    const code = fileContent
    if (typeof code !== "string") {
        throw Error(`fileContent should have been a string, but was a ${typeof code}`)
    }
    // 
    // convert static template strings to actual normal strings (a bit inefficient)
    // 
    const firstTree = parser.parse({string: code, withWhitespace: true})
    const newStringChunks = []
    next_node: for (const [ parents, node, direction ] of firstTree.rootNode.traverse()) {
        // skip children of template strings
        for (const each of parents) {
            if (each.type === "template_string") {
                continue next_node
            }
        }
        if (direction === "->") {
            // special handle template strings
            if (node.type === "template_string") {
                if (isStaticTemplateString(node.text)) {
                    newStringChunks.push(
                        escapeString(eval(node.text), quotesPreference)
                    )
                } else {
                    newStringChunks.push(node.text)
                }
                continue
            }
        }
        // normal
        const isLeafNode = direction == "-"
        if (isLeafNode) {
            newStringChunks.push(node.text)
        }
    }
    const root = parser.parse(newStringChunks.join("")).rootNode
    customConverter = customConverter || (()=>null)
    
    const usesModuleExportSomewhere = !!root.quickQueryFirst(`((member_expression (identifier) (property_identifier)) @outer (#eq? @outer "module.exports"))`)
    const usesExportsSomewhere = !!root.quickQueryFirst(`((identifier) @outer (#eq? @outer "exports"))`)
    const usesExportDefaultSomewhere = !!root.quickQueryFirst(`(export_statement ("export") ("default"))`)
    const usingStatements = root.quickQuery(`(expression_statement (string))`, { maxResultDepth: 2 }).filter(each=>each.text.startsWith("'use ") ||each.text.startsWith('"use '))
    const maxResultDepth = 5 // NOTE: this not as limiting as it seems: we only need to find top-level require statements, all the others will be handled by a different query
                                //       it might be legitmately impossible to have a top level require that is deeper than this
    const handledStatements = [
        // simple require statements
        ...[
            // let/const
            ...root.quickQuery(`((lexical_declaration (variable_declarator (identifier) @importName (call_expression (identifier) @funcCallName (arguments (string) @importPath)))) @statement  (#eq? @funcCallName "require"))`, { maxResultDepth }),
            // var
            ...root.quickQuery(`((variable_declaration (variable_declarator (identifier) @importName (call_expression (identifier) @funcCallName (arguments (string) @importPath)))) @statement  (#eq? @funcCallName "require"))`, { maxResultDepth  }),
        ].map(each=>({...each, importType: 'simple',})),
        
        // complex require statements
        ...[
            // let/const
            ...root.quickQuery(`((lexical_declaration (variable_declarator (object_pattern) @importExpansion (call_expression (identifier) @funcCallName (arguments (string) @importPath)))) @statement (#eq? @funcCallName "require"))`, { maxResultDepth  }),
            // var
            ...root.quickQuery(`((variable_declaration (variable_declarator (object_pattern) @importExpansion (call_expression (identifier) @funcCallName (arguments (string) @importPath)))) @statement (#eq? @funcCallName "require"))`, { maxResultDepth  }),
        ].map(each=>({...each, importType: 'complex'})),

        // pre-expansion: var thing = require('name1').thing2
        ...[
            // const/let
            ...root.quickQuery(`((lexical_declaration (variable_declarator (identifier) @importName (member_expression (call_expression (identifier) @funcCallName (arguments (string) @importPath)) (property_identifier) @attrName))) @statement (#eq? @funcCallName "require"))`, { maxResultDepth: maxResultDepth+1 }),
            // var
            ...root.quickQuery(`
                (
                    (variable_declaration
                        (variable_declarator
                            (identifier) @importName
                            (member_expression
                                (call_expression
                                    (identifier) @funcCallName
                                    (arguments
                                        (string) @importPath
                                    )
                                )
                                (property_identifier) @attrName
                            )
                        )
                    ) @statement
                    (#eq? @funcCallName "require")
                )
            `, { maxResultDepth: maxResultDepth+1 }),
        ].map(each=>({...each, importType: 'simplePreExpansion'})),
        
        // pre-expansion: var { other } = require('name1').thing2
        ...[
            // const/let
            ...root.quickQuery(`((lexical_declaration (variable_declarator (object_pattern) @importExpansion (member_expression (call_expression (identifier) @funcCallName (arguments (string) @importPath)) (property_identifier) @attrName))) @statement (#eq? @funcCallName "require"))`, { maxResultDepth: maxResultDepth+1 }),
            // var
            ...root.quickQuery(`((variable_declaration (variable_declarator (object_pattern) @importExpansion (member_expression (call_expression (identifier) @funcCallName (arguments (string) @importPath)) (property_identifier) @attrName))) @statement (#eq? @funcCallName "require"))`, { maxResultDepth: maxResultDepth+1 }),
            
        ].map(each=>({...each, importType: 'complexPreExpansion'})),

        // plain import: require('name1')
        ...[
            ...root.quickQuery(`
                (
                    (expression_statement
                        (call_expression
                            (identifier) @funcCallName
                            (arguments
                                (string) @importPath
                            )
                        )
                    ) @statement
                    (#eq? @funcCallName "require")
                )
            `, { maxResultDepth: maxResultDepth-1 }),
        ].map(each=>({...each, importType: 'plain'})),

        // TODO: varName = require() // use random generated name and then normal assignment
        // TODO: double expansion: var { other } = require('name1').thing2.thing3
        // TODO: double destructure: var { other: { other2 } } = require('name1').thing2.thing3
        // TODO: function call: var a = require('name1')("stuff")

        // 
        // ES import / export
        // 
        ...[
            // ES import (all different types)
            ...root.quickQuery(`(import_statement (string) @importPath) @statement`, { maxResultDepth: maxResultDepth+1 }),
            
        ].map(each=>({...each, importType: 'esImport'})),
        
        ...[
            // ES import (all different types)
            ...root.quickQuery(`(export_statement (string) @importPath) @statement`, { maxResultDepth: maxResultDepth+1 }),
            
        ].map(each=>({...each, importType: 'esExport'})),
    ]

    let unhandledRequireStatements = root.quickQuery(`((call_expression (identifier) @funcCallName (arguments) @importArgs) @statement (#eq? @funcCallName "require"))`).map(each=>({...each, importType: "unhandlable", }))
    const requireStartIndicies = handledStatements.map(each=>each.funcCallName?.startIndex||each.statement.startIndex) // remove the ones we will have handled
    unhandledRequireStatements = unhandledRequireStatements.filter(each=>!requireStartIndicies.includes(each.funcCallName.startIndex))

    const nodes = handledStatements.concat(unhandledRequireStatements).sort((a,b)=>a.statement.startIndex-b.statement.startIndex)
    const codeChunks = []
    let previousIndex = 0
    for (const { importName, importPath, importExpansion, importType, statement, importArgs, attrName } of nodes) {
        codeChunks.push(
            code.slice(previousIndex, statement.startIndex)
        )
        previousIndex = statement.endIndex
        // if (importType === "esImport" && statement.text.includes("thing79")) {
        //     console.debug(`statement is:`,xmlStylePreview(statement))
        // }
        // 
        // unhandlable case
        // 
        if (importType === "unhandlable") {
            let replacement = null
            if (handleUnhandlable instanceof Function) {
                try {
                    replacement = await handleUnhandlable(importArgs?.text.slice(1,-1), statement.text,statement)
                    if (typeof replacement === "string") {
                        codeChunks.push(replacement)
                    }
                } catch (error) {
                    console.warn(`handleUnhandlable threw an error for ${importArgs?.text}`, error)
                }
            }
            if (!replacement) {
                codeChunks.push(statement.text+`/* FIXME: can't auto handle deep require (await import${importArgs.text}) */`)
            }
            continue
        }
        
        const importPathOriginalString = eval(importPath.text)
        let importPathString
        const newString = await customConverter(importPathOriginalString, path)
        if (typeof newString === "string") {
            importPathString = newString
            if (!importPathString.includes('"') && !importPathString.includes("'")) {
                // WIP better check:
                // flatNodeList(parser.parse(importPathString).rootNode)
                // <program>
                //     <comment text="/*hi*/" />
                //     <expression_statement>
                //         <string>
                //             <"\"" text="\"" />
                //             <string_fragment text="ho" />
                //             <"\"" text="\"" />
                //         </string>
                //         <comment text="/*bye*/" />
                //     </expression_statement>
                // </program>
                console.warn(`toEsm() was given a customConverter().\nThat converter returned a string, but the string wasn't a valid import string.\nIt probably just needed to be escaped but wasn't\n    given                 : ${JSON.stringify(newString)}\n    likely what was needed: ${JSON.stringify(JSON.stringify(newString))}\n\nWhy don't we escape this for you without warning?\nBecause you might want to add a comment/hint after the escaped import\nThe begining of the customConverter was:\n    ${customConverter.toString().slice(0,150)}\n\n`)
                importPathString = JSON.stringify(importPathString)
            }
        }
        if (!importPathString) {
            let localQuotesPreference = quotesPreference
            if (importPath.text.trim().startsWith("'")) {
                localQuotesPreference = "single"
            } else if (importPath.text.trim().startsWith('"')) {
                localQuotesPreference = "double"
            }
            importPathString = await requirePathToEcmaScriptPath(eval(importPath.text), path, { nodeBuildinModuleNames, defaultExtension, convertWarning, quotesPreference: localQuotesPreference })
        }
        // 
        // plain
        // 
        const ending = ""
        if (importType === "plain") {
            codeChunks.push(
                `import ${importPathString}${ending}`
            )
        // 
        // simple
        // 
        } else if (importType === "simple") {
            codeChunks.push(
                `import ${importName.text} from ${importPathString}${ending}`
            )
        // 
        // destructuring
        // 
        } else if (importType === "complex") {
            codeChunks.push(
                `import ${importExpansion.text.replace(/:/g,' as ')} from ${importPathString}${ending}`
            )
        } else if (importType === "simplePreExpansion") {
            if (attrName.text === "default") {
                codeChunks.push(
                    `import ${importName.text} from ${importPathString}${ending}`
                )
            } else {
                codeChunks.push(
                    `import { ${attrName.text} as ${importName.text} } from ${importPathString}${ending}`
                )
            }
        } else if (importType === "complexPreExpansion") {
            if (attrName.text === "default") {
                codeChunks.push(
                    `import ${importExpansion.text.replace(/:/g,' as ')} from ${importPathString}${ending}`
                )
            } else {
                const randomVarName = "tempVar$"+Math.random().toString(36).slice(2)
                codeChunks.push(
                    `import { ${attrName.text} as ${randomVarName} } from ${importPathString}; var ${importExpansion.text} = ${randomVarName}${ending}`
                )
            }
        } else if (importPathString) {
            const text = statement.text
            const preText = text.slice(0, importPath.startIndex-statement.startIndex)
            const postText = text.slice((importPath.endIndex-statement.startIndex))
            let nearybyNext = ""
            // I don't know why this works, but it does. There's probably an error with whitespace nodes between import statements
            // make sure to test run/tests AND
            const enableStupidHack = true
            if (enableStupidHack) {
                nearybyNext = code.slice(statement.endIndex+1, statement.endIndex+3)
                if (nearybyNext.endsWith("i")) {
                    nearybyNext = nearybyNext.slice(0,-1)
                } else {
                    nearybyNext = nearybyNext.slice(0,-2)
                }
                if (code.slice(previousIndex, previousIndex+1) === ";") {
                    previousIndex += 1
                }
            }
            codeChunks.push(
                `${preText}${importPathString}${postText}${nearybyNext}`
            )
        } else {
            codeChunks.push(
                statement.text
            )
        }
    }
    codeChunks.push(
        code.slice(previousIndex, code.length)
    )

    let newCode = codeChunks.join('')
    if (usesModuleExportSomewhere) {
        if (!usesExportDefaultSomewhere) {
            let usingStatement = ""
            if (usingStatements.length > 0) {
                usingStatement = usingStatements[0].text
            }
            newCode = `${usingStatement}var module = module||{};module.exports=module.exports||{};\n${newCode}\n;export default module.exports`
        } else {
            newCode = `\n${newCode}\n;/* CHECKME: module.exports is used but so is export default */`
        }
    } else if (usesExportsSomewhere && !newCode.match(/\bexport default exports\s*;?\s*$/)) {
        newCode = `\n${newCode}\n;export default exports`
    }

    return newCode
}