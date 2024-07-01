import { convertImports } from '../main/pure_api.js'
import { FileSystem } from 'https://deno.land/x/quickr@0.6.67/main/file_system.js' 

const path =  `${FileSystem.thisFolder}/../test/input_file.js`
console.log(await convertImports({
    fileContent: await FileSystem.read(path),
    path,
    customConverter: [
        (importPathString) => {
            if (importPathString === "./bundle-url") {
                return JSON.stringify("this_works.js")
            }
        },
    ],
    handleUnhandlable: (requireArgs, statementText, statement) => {
        console.debug(`requireArgs, statementText, statement is:`,requireArgs, statementText, statement)
        if (requireArgs === "'./bundle-url'") {
            return `import { thing } from "this_works.js"`
        }
    },
}))