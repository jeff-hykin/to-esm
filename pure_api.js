import { defaultNodeBuildinModuleNames, convertImportsBuilder } from "./common_api.js"

export const requirePathToEcmaScriptPath = async (importPathString, pathToCurrentFile, {defaultExtension=".js", nodeBuildinModuleNames=defaultNodeBuildinModuleNames}={})=>{
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
            if (importPathString.endsWith('.json')) {
                importWarning = `CHECKME: importing json is not EcmaScript`
            } else if (importPathString.endsWith('.wasm')) {
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

export const convertImports = convertImportsBuilder(requirePathToEcmaScriptPath)