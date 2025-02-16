import { FileSystem } from "https://deno.land/x/quickr@0.6.67/main/file_system.js"
import { parseArgs, flag, required, initialValue } from "https://deno.land/x/good@1.7.1.0/flattened/parse_args.js"
import { toCamelCase } from "https://deno.land/x/good@1.7.1.0/flattened/to_camel_case.js"
import { didYouMean } from "https://deno.land/x/good@1.7.1.0/flattened/did_you_mean.js"

import { toEsm } from './impure_api.js'
import { version } from "./version.js"

// 
// check for help/version
// 
    const { help: showHelp, version: showVersion, } = parseArgs({
        rawArgs: Deno.args,
        fields: [
            [["--help", ], flag, ],
            [["--version"], flag, ],
        ],
    }).simplifiedNames
    if (showVersion) {
        console.log(version)
        Deno.exit(0)
    }
    if (showHelp) {
        console.log(`
    To Esm
        examples:
            to-esm --help
            to-esm --version
            
            # non-destructive
            to-esm --add-ext .esm -- ./file1.js ./file2.js

            # destructive
            to-esm --inplace ./file1.js
            to-esm -i ./file1.js
            
            # recursive
            to-esm --recursive .
            to-esm -r .

            # import converters
            to-esm --prefix-for-unknowns "npm:" --recursive .
        `)
        Deno.exit(0)
    }

// 
// parsing args
// 
    const output = parseArgs({
        rawArgs: Deno.args,
        fields: [
            [[ "--recursive", "-r"], flag, ],
            [[ "--inplace", "-i"], flag, ],
            [[ "--add-ext", ], initialValue(`.esm`) ],
            [[ "--extensions-to-convert",], initialValue(`.js,.ts,.tsx,.jsx,.mjs`) ],
            // [[1, "--deno-version"], initialValue(`${Deno.version.deno}`), ],
            // [["--no-default-args"], flag, ],
            // [["--add-arg"], initialValue([]), ],
            // [["--add-unix-arg"], initialValue([]), ],
            [["--prefix-for-unknowns"], initialValue(null), (str)=>str ],
        ],
        nameTransformer: toCamelCase,
        namedArgsStopper: "--",
        allowNameRepeats: true,
        valueTransformer: JSON.parse,
        isolateArgsAfterStopper: false,
        argsByNameSatisfiesNumberedArg: true,
        implicitNamePattern: /^(--|-)[a-zA-Z0-9\-_]+$/,
        implictFlagPattern: null,
    })
    didYouMean({
        givenWords: Object.keys(output.implicitArgsByName).filter(each=>each.startsWith(`-`)),
        possibleWords: Object.keys(output.explicitArgsByName).filter(each=>each.startsWith(`-`)),
        autoThrow: true,
    })
    
    // console.debug(`output is:`,output)
    const {
        recursive,
        addExt,
        inplace,
        extensionsToConvert: extensionsToConvertString,
        prefixForUnknowns,
    } = output.simplifiedNames
    let filePaths = output.argList
    const extensionsToConvert = extensionsToConvertString.split(`,`).map(each=>each.trim())
// 
// 
// main logic
// 
// 
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
        convertWarning = async (importPathString, { importWarning }={}) => {
            if (importPathString.startsWith('npm:')) {
                importPathString = importPathString.slice(4)
            }
            if (importWarning.includes('assuming npm')) {
                return `${JSON.stringify(prefixForUnknowns+importPathString)} /* CHECKME: unknown that was prefixed */`
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
