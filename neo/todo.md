apparently the `arguments` when used at the top level in Node.js MODULE (but not repl) give the following:

from: `/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js`
arguments is: [Arguments] {
  "0": {},
  "1": [Function: require] {
    resolve: [Function: resolve] { paths: [Function: paths] },
    main: null,
    extensions: [Object: null prototype] {
      ".js": [Function (anonymous)],
      ".cjs": [Function: loadCjs],
      ".mjs": [Function: loadESMFromCJS],
      ".wasm": [Function: loadESMFromCJS],
      ".json": [Function (anonymous)],
      ".node": [Function (anonymous)]
    },
    cache: [Object: null prototype] {
      "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js": Module {
        id: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
        path: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify",
        exports: {},
        filename: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
        loaded: false,
        parent: Module {
          id: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
          path: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify",
          exports: {},
          filename: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
          loaded: false,
          parent: undefined,
          children: [Array],
          paths: [Array]
        },
        children: [],
        paths: [
          "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/node_modules",
          "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules",
          "/Users/jeffhykin/repos/pica/node_modules/.deno/node_modules",
          "/Users/jeffhykin/repos/pica/node_modules",
          "/Users/jeffhykin/repos/node_modules",
          "/Users/jeffhykin/node_modules",
          "/Users/node_modules",
          "/node_modules"
        ]
      }
    }
  },
  "2": <ref *1> Module {
    id: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
    path: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify",
    exports: {},
    filename: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
    loaded: false,
    parent: Module {
      id: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
      path: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify",
      exports: {},
      filename: "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
      loaded: false,
      parent: undefined,
      children: [ [Circular *1] ],
      paths: [
        "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/node_modules",
        "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules",
        "/Users/jeffhykin/repos/pica/node_modules/.deno/node_modules",
        "/Users/jeffhykin/repos/pica/node_modules",
        "/Users/jeffhykin/repos/node_modules",
        "/Users/jeffhykin/node_modules",
        "/Users/node_modules",
        "/node_modules"
      ]
    },
    children: [],
    paths: [
      "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/node_modules",
      "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules",
      "/Users/jeffhykin/repos/pica/node_modules/.deno/node_modules",
      "/Users/jeffhykin/repos/pica/node_modules",
      "/Users/jeffhykin/repos/node_modules",
      "/Users/jeffhykin/node_modules",
      "/Users/node_modules",
      "/node_modules"
    ]
  },
  "3": "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify/index.js",
  "4": "/Users/jeffhykin/repos/pica/node_modules/.deno/webworkify@1.5.0/node_modules/webworkify"
}