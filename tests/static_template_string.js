import { isStaticTemplateString } from "../main/common_api.js"

var strings = [
    `const { TextDecoder, TextEncoder } = require(\`util\`)`,
    "`howdy ${1}`",
    "`howdy $1}`",
    "`howdy \\${1}`",
    "`howdy \\\\${1}`",
    "`howdy \\\\\\${1}`",
    "``",
    "``",
]
for (const each of strings) {
    console.log(each)
    console.log(isStaticTemplateString(each))
}