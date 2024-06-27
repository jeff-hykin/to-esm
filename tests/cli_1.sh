#!/usr/bin/env bash

deno run -A ../to-esm.js -- ../test/input_file.js
deno run -A ../to-esm.js --recursive --add-ext .other -- ../test/