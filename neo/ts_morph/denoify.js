// detect globals: Buffer, setImmediate, __filename, __dirname, global, exports, module

// technique
    // if global is mentioned, rename it
    // if window is mentioned, rename it
    // if there is mention of Buffer, setImmediate, __filename, __dirname
    //     then add the corrisponding deno import to the top
    // drill down to "root" imports/requires
        // if node import, just remap to "node:"
        // if url import, leave as is
        // if jsr or npm-prefixed import, leave as is
        // if import is from npm (based on string), convert to either npm:thing or esm thing
        // local imports get resolved using to-esm
    // if there's no mention of module or exports, __filename, or __dirname then were good
        // convert imports and were done
            // if node import, just remap to "node:", add to a consolidation list
            // if url import, leave as is
            // if jsr or npm-prefixed import, leave as is, but add the node to a consolidation list
            // if import is from npm (based on string), convert to either npm:thing or esm thing
            // local imports get resolved using to-esm (e.g. get the added file extension)
            // if importing a worker: error for now
            // if importing json use binaryify
            // if importing wasm use binaryify
    // else (commonjs)
        // try to find "root" files that have no imports, only exports
            // do them first
        // export step
            // try to determine named vs unnamed exports
            // check if importers ever use the default export as a function call or in an instanceof expression
                // if no, then its all named imports
            // module.exports
                // if all calls of module.exports are property expressions or assignment to object literals
                    // then try direct named convert
                // otherwise
                    // attempt to do 
                    // check if there is a default export (e.g. module.exports = /*not object literal*/ or export default, or export { default as })
            // if no, then simply convert everything to 
            // find every file that imports whatever is exported

// import cases
    // attempt deno import converter for simple cases
