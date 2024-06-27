import { toEsm } from '../main/impure_api.js'
import { FileSystem } from 'https://deno.land/x/quickr@0.6.67/main/file_system.js' 

console.log(await toEsm({
    path: `${FileSystem.thisFolder}/../test/input_file.js`,
}))