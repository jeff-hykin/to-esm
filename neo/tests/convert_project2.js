import { toEsm, convertProject } from '../main/impure_api.js'
import { FileSystem } from 'https://deno.land/x/quickr@0.7.4/main/file_system.js' 

await convertProject({
    projectFolder: `${FileSystem.thisFolder}/../test`,
    filePaths: [
        `${FileSystem.thisFolder}/../test/layers.ts`,
    ],
    extensionsToConvert: [".js",".ts",".tsx",".jsx",".mjs"],
    prefixForUnknowns: "https://esm.sh/",
    inplace: false,
    recursive: true,
    addExt: ".esm",
})
await FileSystem.move({
    path: `${FileSystem.thisFolder}/../test/layers.esm.ts`,
    newParentFolder: `${FileSystem.thisFolder}/../logs/`,
    overwrite: true,
})
// console.log(await toEsm({
//     path: `${FileSystem.thisFolder}/../test/input_file.js`,
// }))