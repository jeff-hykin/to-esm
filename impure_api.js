import { defaultNodeBuildinModuleNames, convertImportsBuilder } from "./common_api.js"
import { FileSystem, glob } from "https://deno.land/x/quickr@0.6.67/main/file_system.js"

export const requirePathToEcmaScriptPath = async (importPathString, pathToCurrentFile, {nodeBuildinModuleNames=defaultNodeBuildinModuleNames}={})=>{
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
            }
        }
    }
    importPathString = JSON.stringify(importPathString)
    if (importWarning) {
        importPathString = `${importPathString} /* ${importWarning} */`
    }
    return importPathString
}

export const convertImports = convertImportsBuilder(requirePathToEcmaScriptPath)

export const toEsm = async ({path, nodeBuildinModuleNames=defaultNodeBuildinModuleNames})=>convertImports({fileContent: await FileSystem.read(path), path, nodeBuildinModuleNames})