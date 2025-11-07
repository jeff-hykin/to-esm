# What is this for?

Properly converting NodeJS require statements to EcmaScript import statments (using the Tree Sitter parser NOT REGEX, like most the other tools out there). This includes auto-adding `./` in front of local paths, adding `.js` when file extentions are missing, defaulting to `/index.js` when importing a directory, etc.

Works for JavaScript and Typescript.

Note: does not handle exports.

# How do I use it?

There's a CLI, a backend interface, and a client-side interface.

### CLI 

Install

```shell
# install deno
curl -fsSL https://deno.land/install.sh | sh
# install to-esm
deno install -Afg https://deno.land/x/to_esm/main/to-esm.js
```

Usage:
```sh
# non-destructive, creates file1.esm.js, look for "CHECKME" comments
to-esm ./file1.js

# destructive
to-esm --inplace ./file1.js
to-esm -i ./file1.js

# recursive
to-esm --recursive .
to-esm -r .

# choose the rename extension (file1.fixed.js)
to-esm --add-ext .fixed -- ./file1.js
```

NOTE: there will never be a perfect conversion. Check the output for CHECKME and FIXME comments for the cases where there were problems.

### Backend API

```js
import { toEsm } from "https://deno.land/x/to_esm/main/impure_api.js"

// only does one file at a time
const newFileContent = await toEsm({
    path: "./file1.js", 
    customConverter: (importPathString, path) => {
        // convert all npm stuff to esm.sh
        if (importPathString.startsWith("npm:")) {
            return JSON.stringify("https://esm.sh/${importPathString.slice(4)}")
        }
        if (importPathString === "b") {
            return JSON.stringify("https://deno.land/x/a@1.2.3/mod.js")+" // CHECKME "
        } 
    },
    // if you want to hack an edge case for your own project
    handleUnhandlable: (requireArgs, statementText, statement) => {
        // if the require args are "b" or 'b'
        if (requireArgs.match(/("|')b(\1)/)) {
            return `import { a } from "https://deno.land/x/a@1.2.3/mod.js" // CHECKME`
        }
    }
})
```

### Frontend API

Note: the frontend API can't do as much as the backend API because it can't scan the file system to make intelligent guesses.

```js
import { convertImports } from "https://deno.land/x/to_esm/main/pure_api.js"

const newFileContent = await convertImports({
    fileContent: `require("something")`,
    path,
    defaultExtension=".js",
})
```
