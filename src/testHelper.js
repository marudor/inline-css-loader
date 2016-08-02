import { parse } from 'babylon';
import generate from 'babel-generator';
import inlineCssLoader from '.';
import fs from 'fs';
import path from 'path';

function getTree(input) {
  return parse(input, {
    sourceType: 'module',
    plugins: inlineCssLoader.enabledPlugins,
  });
}

export function normalizeInput(input) {
  return generate(getTree(input), {
      minified: true,
    }, input)
    .code;
}

export function runLoader(input) {
  return inlineCssLoader.call({
    generateOptions: {
      minified: true,
      quotes: 'single',
    },
  }, input);
}

export function readFile(filePath) {
  return fs.readFileSync(path.resolve(__dirname, `${filePath}.txt`), { encoding: 'utf8' });
}
