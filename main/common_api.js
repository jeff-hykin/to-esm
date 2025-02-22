import { parserFromWasm, xmlStylePreview, flatNodeList } from "https://deno.land/x/deno_tree_sitter@0.2.6.0/main.js"
// import { parserFromWasm, xmlStylePreview } from "/Users/jeffhykin/repos/deno-tree-sitter/main.js"
import javascript from "https://github.com/jeff-hykin/common_tree_sitter_languages/raw/4d8a6d34d7f6263ff570f333cdcf5ded6be89e3d/main/javascript.js"
const parser = await parserFromWasm(javascript) // path or Uint8Array
import { capitalize, indent, toCamelCase, digitsToEnglishArray, toPascalCase, toKebabCase, toSnakeCase, toScreamingKebabCase, toScreamingSnakeCase, toRepresentation, toString, regex, findAll, iterativelyFindAll, escapeRegexMatch, escapeRegexReplace, extractFirst, isValidIdentifier, removeCommonPrefix } from "https://deno.land/x/good@1.13.0.1/string.js"

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

export function convertImportsBuilder(requirePathToEcmaScriptPath) {
    return async function convertImports({fileContent, path, nodeBuildinModuleNames=defaultNodeBuildinModuleNames, defaultExtension=".js", customConverter=null, handleUnhandlable=()=>null, convertWarning=null}) {
        const code = fileContent
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
                            JSON.stringify(eval(node.text))
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
                importPathString = await requirePathToEcmaScriptPath(eval(importPath.text), path, { nodeBuildinModuleNames, defaultExtension, convertWarning })
            }
            // 
            // plain
            // 
            if (importType === "plain") {
                codeChunks.push(
                    `import ${importPathString}`
                )
            // 
            // simple
            // 
            } else if (importType === "simple") {
                codeChunks.push(
                    `import ${importName.text} from ${importPathString}`
                )
            // 
            // destructuring
            // 
            } else if (importType === "complex") {
                codeChunks.push(
                    `import ${importExpansion.text.replace(/:/g,' as ')} from ${importPathString}`
                )
            } else if (importType === "simplePreExpansion") {
                if (attrName.text === "default") {
                    codeChunks.push(
                        `import ${importName.text} from ${importPathString}`
                    )
                } else {
                    codeChunks.push(
                        `import { ${attrName.text} as ${importName.text} } from ${importPathString}`
                    )
                }
            } else if (importType === "complexPreExpansion") {
                if (attrName.text === "default") {
                    codeChunks.push(
                        `import ${importExpansion.text.replace(/:/g,' as ')} from ${importPathString}`
                    )
                } else {
                    const randomVarName = "tempVar$"+Math.random().toString(36).slice(2)
                    codeChunks.push(
                        `import { ${attrName.text} as ${randomVarName} } from ${importPathString}; var ${importExpansion.text} = ${randomVarName}`
                    )
                }
            } else if (importPathString) {
                const text = statement.text
                const preText = text.slice(0, importPath.startIndex-statement.startIndex)
                const postText = text.slice(importPath.endIndex-statement.startIndex)
                codeChunks.push(
                    `${preText}${importPathString}${postText}`
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
}