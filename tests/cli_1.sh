#!/usr/bin/env bash

deno run -A ../main/to-esm.js -- ../test/input_file.js
mv ../test/input_file.esm.js ../logs/input_file.esm.js

deno run -A ../main/to-esm.js --recursive --add-ext .other -- ../test/
mv ../test/input_file.other.js ../logs/input_file.other.js
rm -f ../test/input_file.other.ts