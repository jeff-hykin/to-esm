// import { Project, ScriptTarget, SyntaxKind, Node } from "jsr:@ts-morph/ts-morph"
// export { Project, ScriptTarget, SyntaxKind, Node } from "jsr:@ts-morph/ts-morph"
// import { Project, ScriptTarget, SyntaxKind, Node } from "https://esm.sh/v135/@jsr/ts-morph__ts-morph@24.0.0/"
// import { Project, ScriptTarget, SyntaxKind, Node } from "./ts_fix.js"
import { Project, ScriptTarget, SyntaxKind, Node } from "../ts_morph.js"
export { Project, ScriptTarget, SyntaxKind, Node }

// NOTE!: this doesn't do what we would hope, but its still useful
    // > getWrongDepth(file1)
    // 0
    // > getWrongDepth(file1.getChildren()[0])
    // 1
    // > getWrongDepth(file1.getChildren()[0].getChildren()[0])
    // 1
    // > var d2 = file1.getChildren()[0].getChildren()[0]
    // undefined
    // > var d1 = file1.getChildren()[0]
    // undefined
    // > d1 == d2
    // false
    // > d1.getParent() == file1
    // true
    // > d2.getParent() == file1
    // true
function getWrongDepth(item) {
    let depth = 0
    while (item.getParent() && item != item.getParent()) {
        depth++
        item = item.getParent()
    }
    return depth
}
// NOTE: probably not perfect
export function getNodeId(node) {
    // note: start+end+depth is STILL not unique!, have add kind (at least)
    return `${node.getStart()}:${node.getEnd()}:${getWrongDepth(node)}:${node.getKind()}:${node.getChildren().length}`
}

export function recursive(item, func, { first=Infinity, visited=new Set()}={}) {
    let results = []
    let children
    try {
        children = item.getChildren()
    } catch (error) {
        try {
            console.log(`unble to get children of ${item.print()}`)
        } catch (error) {
            console.log(`unble to get children`)
        }
    }
    for (const node of children) {
        if (results.length+1 > first) {
            break
        }
        const nodeId = getNodeId(node)
        if (!visited.has(nodeId)) {
            visited.add(nodeId)
            try {
                results.push(func(node))
            } catch (error) {
                console.error(error)
                results.push(error)
                // console.debug(`nodeId is:`,nodeId, "  ", node.print())
                // console.debug("couldn't print")
            }
            results.push(...recursive(node, func, { first: first-results.length, visited}))
        }
    }
    return results
}
const declareKinds = new Set([
    SyntaxKind.VariableDeclaration,
    SyntaxKind.ClassDeclaration,
    SyntaxKind.InterfaceDeclaration,
    SyntaxKind.TypeAliasDeclaration,
    SyntaxKind.EnumDeclaration,
    SyntaxKind.ImportEqualsDeclaration,
    SyntaxKind.NamespaceImport,
    SyntaxKind.ImportClause,
    SyntaxKind.ImportAttributes,
    SyntaxKind.ImportAttribute,
    SyntaxKind.ImportTypeAssertionContainer,
    SyntaxKind.ImportType,
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.Parameter,
    // "VariableDeclarationList",
    // "ImportDeclaration",
    // "NamedImports",
    // "ImportSpecifier",
])

function getLocalsForExternal(file) {
    const declares = recursive(file, (node) => node).filter(each=>declareKinds.has(each.getKind()))
    const nodesToIgnore = new Set()
    const symbolToNodes = new Map()
    const localSymbols = new Set()
    const addSymbol = (node)=>{
        const sym = node.getSymbol()
        if (sym) {
            localSymbols.add(sym)
            let nodes
            if (symbolToNodes.has(sym)) {
                nodes = symbolToNodes.get(sym)
            } else {
                nodes = new Map()
                symbolToNodes.set(sym, nodes)
            }
            nodes.set(getNodeId(node), node)
            return sym
        } else {
            nodesToIgnore.add(getNodeId(node))
            // console.debug(`has no symbol: `, node)
        }
    }
    for (const eachDeclareNode of declares) {
        const kind = eachDeclareNode.getKind()
        const text = eachDeclareNode.getText()
        if (kind == SyntaxKind.ImportClause || kind == SyntaxKind.NamespaceImport) {
            const identifiers = recursive(eachDeclareNode, node=>node).filter(eachNode=>eachNode.getKind()==SyntaxKind.Identifier)
            for (const each of identifiers) {
                addSymbol(each)
            }
        } else if (kind == SyntaxKind.VariableDeclaration) {
            let preAssignmentNodes = []
            for (const each of eachDeclareNode.getChildren()) {
                if (each.getKind() == SyntaxKind.FirstAssignment) {
                    break
                }
                preAssignmentNodes.push(each)
            }
            for (const each of preAssignmentNodes) {
                if (each.getKind() == SyntaxKind.Identifier) {
                    addSymbol(each)
                } else {
                    const identifiers = recursive(each, node=>node).filter(eachNode=>eachNode.getKind()==SyntaxKind.Identifier)
                    for (const each of identifiers) {
                        addSymbol(each)
                    }
                }
                // NOTE: lazy, there are symbols which will be included that could never be used anywhere
            }
        } else if (
            [
                SyntaxKind.FunctionDeclaration,
                SyntaxKind.ClassDeclaration,
                SyntaxKind.InterfaceDeclaration,
                SyntaxKind.TypeAliasDeclaration,
                SyntaxKind.EnumDeclaration,
            ].includes(kind)
        ) {
            const identifiers = eachDeclareNode.getChildren().filter(eachNode=>eachNode.getKind()==SyntaxKind.Identifier)
            for (const each of identifiers) {
                addSymbol(each)
            }
        // } else if (kind == SyntaxKind.VariableDeclaration) {
        } else {
            console.warn(`Not handled by declare-detector (for finding local vs global vars): ${SyntaxKind[kind]}`)
        }
    }
    return {localSymbols, symbolToNodes, nodesToIgnore}
}

/**
 * top-level identifiers of a file
 *
 * @example
 * ```js
 * import { Project, ScriptTarget, SyntaxKind, Node } from "../ts_morph.js"
 * import { makePretty } from "./pretty_print.js"
 * makePretty({Project, SyntaxKind})
 * var project = new Project({compilerOptions: {target: ScriptTarget.ES2022,},})
 * var file = project.createSourceFile(`blah.ts`, "const requireWithFriendlyError = id => {}")
 * console.log(getExternals(file))
 * ```
 *
 * @param file - a file from a ts morph project
 * @returns a map of node ids keys (index/length) with values being node objects
 */
export function getExternals(file) {
    const identifiers = recursive(file, (node) => node).filter(each=>each.getKind() == SyntaxKind.Identifier)
    const {localSymbols, symbolToNodes, nodesToIgnore} = getLocalsForExternal(file)
    const externals = new Map()
    for (let each of identifiers) {
        const parentKind = each.getParent().getKind()
        // not actually an identifier
        if (parentKind == SyntaxKind.PropertyAssignment) {
            continue
        }
        // also not (always) identifiers
        if (parentKind == SyntaxKind.PropertyAccessExpression) {
            // grab the "obj" inside of obj.thing1.thing2
            // (thing2 and thing1 are treated as identifiers)
            each = recursive(each.getParent(), e=>e).filter(eachNode=>eachNode.getKind()==SyntaxKind.Identifier)[0]
        }
        
        const sym = each.getSymbol()
        if (!sym) {
            if (nodesToIgnore.has(getNodeId(each))) {
                continue
            }
        } else if (localSymbols.has(sym)) {
            continue
        }
        externals.set(getNodeId(each), each)
    }
    return externals
}
export function getLocals(file) {
    return getLocalsForExternal(file).symbolToNodes
}