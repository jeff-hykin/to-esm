import { convertImports } from '../main/pure_api.js'
import { FileSystem } from 'https://deno.land/x/quickr@0.6.67/main/file_system.js'

const path =  `${FileSystem.thisFolder}/../test/input_file.js`
console.log(await convertImports({
    fileContent: await FileSystem.read(path),
    path,
    customConverter: (importPathString, path) => {
        if (importPathString === "./bundle-url") {
            return JSON.stringify("this_works.js")
        }
        // js -> ts
        const typescriptPath = importPathString.slice(0,-3)+".ts"
        const targetImportAsTypeScript = `${FileSystem.parentPath(path)}/${typescriptPath}`
        if (importPathString.endsWith(".js") && FileSystem.sync.info(targetImportAsTypeScript).isFile) {
            return JSON.stringify(typescriptPath)
        }
        // ? -> ts
        const targetImport = `${FileSystem.parentPath(path)}/${importPathString}`
        console.debug(`targetImport is:`,targetImport)
        console.debug(`FileSystem.sync.info(targetImport).isFile is:`,FileSystem.sync.info(targetImport).isFile)
        if (!FileSystem.sync.info(targetImport).isFile) {
            const typescriptPath = importPathString+".ts"
            const targetImportAsTypeScript = `${FileSystem.parentPath(path)}/${typescriptPath}`
            console.debug(`targetImportAsTypeScript is:`,targetImportAsTypeScript)
            console.debug(`FileSystem.sync.info(targetImportAsTypeScript).isFile is:`,FileSystem.sync.info(targetImportAsTypeScript).isFile)
            if (FileSystem.sync.info(targetImportAsTypeScript).isFile) {
                return JSON.stringify(typescriptPath)
            }
        }
    },
    handleUnhandlable: (requireArgs, statementText, statement) => {
        console.debug(`requireArgs, statementText, statement is:`,requireArgs, statementText, statement)
        if (requireArgs === "'./bundle-url'") {
            return `import { thing } from "this_works.js"`
        }
    },
}))