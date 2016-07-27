// @flow
import inlineCssLoader from '..';
import fs from 'fs';
import path from 'path';
import { parse } from 'babylon';
import generate from 'babel-generator';


function getTree(input) {
  return parse(input, { sourceType: 'module' });
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

describe('inline CSS Loader', () => {
  // const exportNodes = [];
  // exportNodes.push(readFile('exportNode/es5'));
  // exportNodes.push(readFile('exportNode/es6'));
  // exportNodes.push(readFile('exportNode/babel'));
  // exportNodes.push(readFile('exportNode/babelLoose'));
  // exportNodes.push(readFile('exportNode/babelSpread'));
  // exportNodes.push(readFile('exportNode/babelRuntimeSpread'));
  // exportNodes.push(readFile('exportNode/webpack'));
  // exportNodes.push(readFile('exportNode/webpack2'));
  // exportNodes.push(readFile('exportNode/webpack3'));
  // exportNodes.push(readFile('exportNode/webpack4'));
  // exportNodes.push(readFile('exportNode/webpack5'));
  // it('should find nodes', () => {
  //   exportNodes.forEach(n => {
  //     const tree = parseCode(n);
  //     expect(tree).toBeDefined();
  //     const root = inlineCssLoader.getExportsNode(tree.body);
  //     expect(root).toBeDefined();
  //     expect(root.type).toBe('ObjectExpression');
  //   });
  // });

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
