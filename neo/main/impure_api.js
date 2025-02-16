import { defaultNodeBuildinModuleNames, convertImportsBuilder } from "./common_api.js"
import { FileSystem, glob } from "https://deno.land/x/quickr@0.7.4/main/file_system.js"
// import { FileSystem, glob } from "/Users/jeffhykin/repos/quickr/main/file_system.js"
import { commonPrefix } from "https://esm.sh/gh/jeff-hykin/good-js@1.14.3.0/source/flattened/common_prefix.js"

export const requirePathToEcmaScriptPath = async (importPathString, pathToCurrentFile, {nodeBuildinModuleNames=defaultNodeBuildinModuleNames, convertWarning}={})=>{
    const targetPath = `${FileSystem.parentPath(pathToCurrentFile)}/${importPathString}`
    let importWarning = null
    if (nodeBuildinModuleNames.includes(importPathString)) {
        importPathString = `node:${importPathString}`
    } else if (!(importPathString.endsWith('.js') || importPathString.endsWith('.ts'))) {
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
    let importPathCode = JSON.stringify(importPathString)
    if (importWarning) {
        const importPathCodeWithWarning = `${importPathCode} /* ${importWarning} */`
        if (convertWarning) {
            importPathCode = (await convertWarning(importPathString, { importWarning, pathToCurrentFile })) || importPathCodeWithWarning    
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
 * //import { convertImports } from "https://deno.land/x/to_esm/main/impure_api.js"
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
 * @returns {string} output - the converted file content
 *
 */
export const convertImports = convertImportsBuilder(requirePathToEcmaScriptPath)

/**
 * file string with require() to file string with import()
 *
 * @example
 * ```js
 * //import { toEsm } from "https://deno.land/x/to_esm/main/impure_api.js"
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

/**
 * @example
 * ```js
 * console.log(await parentPath("/Users/jeffhykin/repos/esm-pytorch/src/"))
 * ```
 */
export const getDepVersions = async (parentPath)=>{
    var projectFolderOrNull = await FileSystem.walkUpUntil(["package.json","deno.json"], parentPath)
    let depVersions = {}
    if (projectFolderOrNull) {
        const jsonPath =`${projectFolderOrNull}/package.json` 
        if (await FileSystem.exists(jsonPath)) {
            try {
                const pkg = JSON.parse(await FileSystem.read(jsonPath))
                const deps = {...pkg.dependencies, ...pkg.devDependencies,}
                for (const [key, value] of Object.entries(deps)) {
                    if (typeof value === "string") {
                        let semverMatch
                        if (semverMatch=value.match(/[^0-9\. \t\n]{0,5}(\d+\.\d+\.\d+)/)) {
                            depVersions[key] = semverMatch[1]
                        }
                    }
                }
            } catch (error) {
                
            }
        }
    }
    return depVersions
}

const npmPackageNameRegex = /^((@[a-z0-9-~][a-z0-9-._~]*\/)?([a-z0-9-~][a-z0-9-._~]*))(.+)/ // https://github.com/dword-design/package-name-regex/blob/master/src/index.js
export async function convertProject({ projectFolder, filePaths, extensionsToConvert=[".js",".ts",".tsx",".jsx",".mjs"], prefixForUnknowns="https://esm.sh/", inplace=false, recursive=false, addExt=".esm"}) {
    // const parentPath = FileSystem.parentOfAllPaths(filePaths)
    const depVersions = await getDepVersions(projectFolder)
    // const projectFolder = (await FileSystem.walkUpUntil(["package.json","deno.json",".git"], parentPath))||parentPath
        // let centralImportsPath = `${projectFolder}/imports.js`
        // await FileSystem.ensureIsFile(centralImportsPath)
        // // regenate
        // if ((await FileSystem.read(centralImportsPath)).startsWith("// created by to-esm")) {
        //     FileSystem.write({ data: ``, path: centralImportsPath, overwrite: true })
        // }
        // const importJsContent = await FileSystem.read(centralImportsPath)
        // const importedVersionStuff = {}
    
    
    const fileInfos = await Promise.all(filePaths.map(each=>FileSystem.info(each)))
    const folders = fileInfos.filter(each=>each.isDirectory).map(each=>each.path)
    if (!recursive) {
        if (folders.length > 0) {
            throw Error(`If you want to convert a folder, use the --recursive flag.\n(folders: ${JSON.stringify(folders)})`)
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
        convertWarning = async (importPathString, { importWarning, pathToCurrentFile }={}) => {
            if (importPathString.startsWith('npm:')) {
                importPathString = importPathString.slice(4)
            }
            // TODO: jsr
            // TODO: deno.land

            if (importWarning.includes('assuming npm')) {
                // const sourcePath = FileSystem.makeRelativePath({from: pathToCurrentFile, to: centralImportsPath})
                let match
                if (match = importPathString.match(npmPackageNameRegex)) {
                    const [ _ , thePackage, namespace, nameInNamespace, rest ] = match
                    // 
                    // get version
                    // 
                        let version;
                        if (depVersions[thePackage]) {
                            version = depVersions[thePackage]
                        } else {
                            // try to get version from esm.sh
                            try {
                                const text = await fetch(`https://esm.sh/${thePackage}`).then(each=>each.text())
                                const remainingVersion = text.slice(0,`/* esm.sh - ${thePackage}`.length)
                                if (remainingVersion.startsWith("@")) {
                                    version = remainingVersion.slice(1).split(" ")[0]
                                }
                            } catch (error) {
                                
                            }
                        }
                        if (!version) {
                            // unable to handle
                            return `${JSON.stringify(prefixForUnknowns+importPathString)} /* CHECKME: unknown that was prefixed */`
                        }
                    //
                    // default to esm.sh
                    //
                        return `${JSON.stringify(`https://esm.sh/${thePackage}@${version}${rest}`)}`
                        
                } else {
                    // unable to handle
                    return `${JSON.stringify(prefixForUnknowns+importPathString)} /* CHECKME: unknown that was prefixed */`
                }
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
                    return FileSystem.write({ data: each, path: `${folders.join("/")}/${itemName}${addExt}${itemExtensionWithDot}`, overwrite: true})
                }
            })
        )
    }
    await Promise.all(promises)
}