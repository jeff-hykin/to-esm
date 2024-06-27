# What is this for?

Converting NodeJS require statements to EcmaScript import statments (for JavaScript and TypeScript)

# How do I use it?

There's a CLI, a backend interface, and a client-side interface.

### CLI 

Install

```shell
# isntall deno
curl -fsSL https://deno.land/install.sh | sh
# install to-esm
deno install -Afg https://deno.land/x/to_esm/main/to-esm.js
```

Usage
```sh
# non-destructive, creates file1.esm.js
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

### Backend API

```js
import { toEsm } from "https://deno.land/x/to_esm/main/impure_api.js"

// only does one file at a time
const newFileContent = await toEsm({ path: "./file1.js", })
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