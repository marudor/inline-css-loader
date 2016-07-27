// @flow
import inlineCssLoader from '..';
import fs from 'fs';
import path from 'path';
import { parse } from 'babylon';
import generate from 'babel-generator';

function getTree(input) {
  return parse(input, {
    sourceType: 'module',
    plugins: inlineCssLoader.enabledPlugins,
  });
}

function normalizeInput(input) {
  return generate(getTree(input), {
    minified: true,
  }, input).code;
}

function runLoader(input) {
  return inlineCssLoader.call({
    generateOptions: {
      minified: true,
      quotes: 'single',
    },
  }, input);
}

function readFile(filePath) {
  return fs.readFileSync(path.resolve(__dirname, `${filePath}.txt`), { encoding: 'utf8' });
}

describe('HandPicked', () => {
  const fullparseCode = [];
  fullparseCode.push(readFile('fullObjects/simple'));
  fullparseCode.push(readFile('fullObjects/spread'));
  fullparseCode.push(readFile('fullObjects/media'));
  it('parseCode, doNothing', () => {
    fullparseCode.forEach(obj => {
      const generatedFromTree = normalizeInput(obj);
      expect(generatedFromTree).toBe(runLoader(obj));
    });
  });

  it('temp', () => {
    const temp = {
      input: readFile('transforms/complexIn'),
      output: readFile('transforms/complexOut'),
    };
    const generatedFromTree = normalizeInput(temp.output);
    expect(generatedFromTree).toBe(runLoader(temp.input));
  });
  //
  const transforms = [];
  transforms.push({
    input: readFile('transforms/simpleIn'),
    output: readFile('transforms/simpleOut'),
  });
  transforms.push({
    input: readFile('transforms/spreadIn'),
    output: readFile('transforms/spreadOut'),
  });
  transforms.push({
    input: readFile('transforms/complexIn'),
    output: readFile('transforms/complexOut'),
  });
  transforms.push({
    input: readFile('transforms/realIn'),
    output: readFile('transforms/realOut'),
  });

  it('transforms', () => {
    transforms.forEach(t => {
      const generatedFromTree = normalizeInput(t.output);
      expect(generatedFromTree).toBe(runLoader(t.input));
    });
  });

  it('complexRealTransform', () => {
    const inp = readFile('transforms/complexRealIn');
    const out = readFile('transforms/complexRealOut');
    const generatedFromTree = normalizeInput(out);
    expect(generatedFromTree).toBe(runLoader(inp));

    let inpES6 = readFile('transforms/complexRealInES6');
    let outES6 = readFile('transforms/complexRealOutES6');
    let generatedFromTreeES6 = normalizeInput(outES6);
    expect(generatedFromTreeES6).toBe(runLoader(inpES6));

    inpES6 = readFile('transforms/complexFlowRealInES6');
    outES6 = readFile('transforms/complexFlowRealOutES6');
    generatedFromTreeES6 = normalizeInput(outES6);
    expect(generatedFromTreeES6).toBe(runLoader(inpES6));
  });
  //
  it('mediaQuery', () => {
    const inp = readFile('transforms/mediaQueryIn');
    const out = readFile('transforms/mediaQueryOut');
    const generatedFromTree = normalizeInput(out);
    expect(generatedFromTree).toBe(runLoader(inp));
  });

  const simple = [];
  simple.push({
    input: readFile('simple/simpleIn'),
    output: readFile('simple/simpleOut'),
  });
  simple.push({
    input: readFile('simple/simpleES6In'),
    output: readFile('simple/simpleES6Out'),
  });
  simple.push({
    input: readFile('simple/simpleOverrideIn'),
    output: readFile('simple/simpleOverrideOut'),
  });

  it('simple', () => {
    simple.forEach(t => {
      const generatedFromTree = normalizeInput(t.output);
      expect(generatedFromTree).toBe(runLoader(t.input));
    });
  });
  //
  it('webpack', () => {
    const inp = readFile('webpackIn');
    const out = readFile('webpackOut');
    const generatedFromTree = normalizeInput(out);
    expect(generatedFromTree).toBe(runLoader(inp));
  });
});

describe('real Examples', () => {
  const tests = fs.readdirSync(path.resolve(__dirname, 'real'));
  tests
  .map(testFolder => ({
    name: testFolder,
    inp: readFile(`real/${testFolder}/input`),
    out: readFile(`real/${testFolder}/output`),
  }))
  .forEach(testFolder => {
    it(testFolder.name, () => {
      const out = normalizeInput(testFolder.out);
      expect(out).toBe(runLoader(testFolder.inp));
    });
  });
});
