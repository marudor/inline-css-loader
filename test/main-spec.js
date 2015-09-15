import chai from 'chai';
import fs from 'fs';
import path from 'path';
const expect = chai.expect;
import { parse } from 'acorn';
import escodegen from 'escodegen';
import _ from 'lodash';

import inlineCssLoader, { getExportsNode } from '../index.js';

describe('inline CSS Loader', () => {
  const exportNodes = [];
  exportNodes.push(require('./exportNode/es5'));
  exportNodes.push(require('./exportNode/babel'));
  exportNodes.push(require('./exportNode/babelLoose'));
  exportNodes.push(require('./exportNode/babelSpread'));
  exportNodes.push(require('./exportNode/babelRuntimeSpread'));
  it('should find nodes', () => {
    _.each(exportNodes, n => {
      const tree = parse(n);
      expect(tree).to.exist;
      const root = getExportsNode(tree.body);
      expect(root).to.exist;
    });
  });

  const fullParse = [];
  fullParse.push(require('./fullObjects/simple'));
  fullParse.push(require('./fullObjects/spread'));
  fullParse.push(require('./fullObjects/media'));
  it('parse, doNothing', () => {
    _.each(fullParse, obj =>  {
      const generatedFromTree = escodegen.generate(parse(obj));
      expect(generatedFromTree).to.equal(inlineCssLoader.call({}, obj));
    })
  });

  it('temp', () => {
    const temp = require('./transforms/complex');
    const generatedFromTree = escodegen.generate(parse(temp.output));
    expect(generatedFromTree).to.equal(inlineCssLoader.call({}, temp.input));
  });

  const transforms = [];
  transforms.push(require('./transforms/simple'));
  transforms.push(require('./transforms/spread'));
  transforms.push(require('./transforms/complex'));

  it('transforms', () => {
    _.each(transforms, t => {
      const generatedFromTree = escodegen.generate(parse(t.output));
      expect(generatedFromTree).to.equal(inlineCssLoader.call({}, t.input))
    });
  });

});
