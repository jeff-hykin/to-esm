#!/usr/bin/env -S deno run --allow-all
import { Project, ScriptTarget, SyntaxKind, Node } from "../ts_morph.js"
import { makePretty } from "../ts_morph/pretty_print.js"
import { getNonstandardExternalNames } from "../ts_morph/utils.js"
makePretty({Project, SyntaxKind})
var project = new Project({compilerOptions: {target: ScriptTarget.ES2022,},})
var file = project.createSourceFile(`blah.ts`, `
export function convertProject() {
    const fileInfos = await Promise.all(filePaths.map(each=>FileSystem.info(each)))
    const folders = fileInfos.filter(each=>each.isDirectory).map(each=>each.path)
    if (!recursive) {
        if (folders.length > 0) {
            throw Error(\`If you want to convert a folder, use the --recursive flag.\n(folders: \${JSON.stringify(folders)})\`)
        }
    } else {
        filePaths = fileInfos.filter(each=>!each.isDirectory).map(each=>each.path)
        let extraPaths = []
        for (const each of folders) {
            extraPaths = extraPaths.concat(await FileSystem.listFilePathsIn(each, {recursively: true}))
        }
        extraPaths = extraPaths.filter(
            eachPath=>extensionsToConvert.some(
                anExtension=>eachPath.endsWith(anExtension)
            )
        )
        filePaths = filePaths.concat(extraPaths)
    }
    let convertWarning = null
    if (prefixForUnknowns) {
        convertWarning = async (importPathString, { importWarning }={}) => {
            if (importPathString.startsWith('npm:')) {
                importPathString = importPathString.slice(4)
            }
            if (importWarning.includes('assuming npm')) {
                return \`\${JSON.stringify(prefixForUnknowns+importPathString)} /* CHECKME: unknown that was prefixed */\`
            }
        }
    }
    
    const promises = []
    for (const eachPath of filePaths) {
        promises.push(
            toEsm({
                path: eachPath,
                convertWarning,
            }).then(each=>{
                if (inplace) {
                    return FileSystem.write({ data: each, path: eachPath, overwrite: true})
                } else {
                    const [ folders, itemName, itemExtensionWithDot ] = FileSystem.pathPieces(eachPath)
                    return FileSystem.write({ data: each, path: \`\${folders.join("/")}/\${itemName}\${addExt}\${itemExtensionWithDot}\`, overwrite: true})
                }
            })
        )
    }
    await Promise.all(promises)
}
`)
console.log(getNonstandardExternalNames(file))