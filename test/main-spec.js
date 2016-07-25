import chai from 'chai';
import fs from 'fs';
const expect = chai.expect;
import { parse } from 'acorn';
import escodegen from 'escodegen';
const parseCode = (input) => parse(input, {
  ecmaVersion: 6,
  sourceType: 'module',
});

import inlineCssLoader, { getExportsNode } from '../index.js';

describe('inline CSS Loader', () => {
  const exportNodes = [];
  exportNodes.push(require('./exportNode/es5').default);
  exportNodes.push(require('./exportNode/es6').default);
  exportNodes.push(require('./exportNode/babel').default);
  exportNodes.push(require('./exportNode/babelLoose').default);
  exportNodes.push(require('./exportNode/babelSpread').default);
  exportNodes.push(require('./exportNode/babelRuntimeSpread').default);
  exportNodes.push(require('./exportNode/webpack').default);
  exportNodes.push(require('./exportNode/webpack2').default);
  exportNodes.push(require('./exportNode/webpack3').default);
  it('should find nodes', () => {
    exportNodes.forEach(n => {
      const tree = parseCode(n);
      expect(tree).to.exist;
      const root = getExportsNode(tree.body);
      expect(root).to.exist;
      expect(root.type).to.equal('ObjectExpression');
    });
  });

  const fullparseCode = [];
  fullparseCode.push(require('./fullObjects/simple').default);
  fullparseCode.push(require('./fullObjects/spread').default);
  fullparseCode.push(require('./fullObjects/media').default);
  it('parseCode, doNothing', () => {
    fullparseCode.forEach(obj => {
      const generatedFromTree = escodegen.generate(parseCode(obj));
      expect(generatedFromTree).to.equal(inlineCssLoader.call({}, obj));
    });
  });
  //
  it('temp', () => {
    const temp = require('./transforms/complex');
    const generatedFromTree = escodegen.generate(parseCode(temp.output));
    expect(generatedFromTree).to.equal(inlineCssLoader.call({}, temp.input));
  });
  //
  const transforms = [];
  transforms.push(require('./transforms/simple'));
  transforms.push(require('./transforms/spread'));
  transforms.push(require('./transforms/complex'));

  it('transforms', () => {
    transforms.forEach(t => {
      const generatedFromTree = escodegen.generate(parseCode(t.output));
      expect(generatedFromTree).to.equal(inlineCssLoader.call({}, t.input));
    });
  });

  require.extensions['.txt'] = function(module, filename) {
    module.exports = fs.readFileSync(filename, 'utf8');
  };

  it('complexRealTransform', () => {
    const inp = require('./transforms/complexRealIn.txt');
    const out = require('./transforms/complexRealOut.txt');
    const generatedFromTree = escodegen.generate(parseCode(out));
    expect(generatedFromTree).to.equal(inlineCssLoader.call({}, inp));
    let inpES6 = require('./transforms/complexRealInES6.txt');
    let outES6 = require('./transforms/complexRealOutES6.txt');
    let generatedFromTreeES6 = escodegen.generate(parseCode(outES6));
    expect(generatedFromTreeES6).to.equal(inlineCssLoader.call({}, inpES6));

    inpES6 = require('./transforms/complexFlowRealInES6.txt');
    outES6 = require('./transforms/complexFlowRealOutES6.txt');
    generatedFromTreeES6 = escodegen.generate(parseCode(outES6));
    expect(generatedFromTreeES6).to.equal(inlineCssLoader.call({}, inpES6));
  });

  it('mediaQuery', () => {
    const inp = require('./transforms/mediaQueryIn.txt');
    const out = require('./transforms/mediaQueryOut.txt');
    const generatedFromTree = escodegen.generate(parseCode(out));
    expect(generatedFromTree).to.equal(inlineCssLoader.call({}, inp));
  });

  const simple = [];
  simple.push(require('./simple/simple'));
  simple.push(require('./simple/simpleES6'));
  simple.push(require('./simple/simpleOverride'));

  it('simple', () => {
    simple.forEach(t => {
      const generatedFromTree = escodegen.generate(parseCode(t.output));
      expect(generatedFromTree).to.equal(inlineCssLoader.call({}, t.input));
    });
  });

  const big = [];

  it('big', () => {
    big.forEach(t => {
      const generatedFromTree = escodegen.generate(parseCode(t.output));
      expect(generatedFromTree).to.equal(inlineCssLoader.call({}, t.input));
    });
  });

  it('webpack', () => {
    const inp = require('./webpackIn.txt');
    const out = require('./webpackOut.txt');
    const generatedFromTree = escodegen.generate(parseCode(out));
    expect(generatedFromTree).to.equal(inlineCssLoader.call({}, inp));
  });
});
