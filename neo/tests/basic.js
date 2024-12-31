import { Project, ScriptTarget, SyntaxKind, Node } from "../ts_morph.js"
import { makePretty } from "../ts_morph/pretty_print.js"
import { getExternals } from "../ts_morph/utils.js"
makePretty({Project, SyntaxKind})
var project = new Project({compilerOptions: {target: ScriptTarget.ES2022,},})
var file = project.createSourceFile(`blah.ts`, "const requireWithFriendlyError = id => {}")
console.log(getExternals(file))