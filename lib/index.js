'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _escodegen = require('escodegen');

var _escodegen2 = _interopRequireDefault(_escodegen);

var _acorn = require('acorn');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getExportsNode(nodes) {
  var result = undefined;
  _lodash2.default.some(nodes, function (node) {
    if (node.type === 'ExportDefaultDeclaration') {
      result = node.declaration;
      return true;
    }
    var exp = node.expression;
    if (exp && exp.type === 'AssignmentExpression' && exp.left.type === 'MemberExpression' && (exp.left.object.name === 'exports' || exp.left.property.name === 'exports')) {
      if (exp.right.type === 'ObjectExpression') {
        result = exp.right;
        return true;
      } else if (exp.right.type === 'CallExpression') {
        result = _lodash2.default.last(exp.right.arguments);
        return true;
      }
    }
  });
  return result;
}

function addToObjectExpressionToCallExpression(call, object) {
  if (object.properties) {
    if (call.arguments.length > 2) {
      call.arguments[2].properties = call.arguments[2].properties.concat(object.properties);
    } else {
      call.arguments.push({
        type: 'ObjectExpression',
        properties: object.properties
      });
    }
  }
}

function addToNode(parentNode, childNode) {
  if (parentNode.type === 'ObjectExpression') {
    if (childNode.type === 'ObjectExpression') {
      (function () {
        var childNodeKeys = _lodash2.default.map(childNode.properties, function (p) {
          return p.key;
        });
        parentNode.properties = _lodash2.default.filter(parentNode.properties, function (p) {
          return p.key && _lodash2.default.includes(childNodeKeys, p.key.name);
        });
        parentNode.properties = parentNode.properties.concat(childNode.properties);
      })();
    } else if (childNode.type === 'CallExpression') {
      var oldProps = _lodash2.default.clone(parentNode.properties);
      _lodash2.default.extend(parentNode, childNode);
      addToObjectExpressionToCallExpression(parentNode, { properties: oldProps });
    }
  } else if (parentNode.type === 'CallExpression') {
    if (childNode.type === 'ObjectExpression') {
      addToObjectExpressionToCallExpression(parentNode, childNode);
    } else if (childNode.type === 'CallExpression') {
      parentNode.arguments.push(childNode.arguments[1]);
      if (childNode.arguments.length > 2) {
        parentNode.arguments.push(childNode.arguments[2]);
      }
    }
  }
}

function addToParent(oldKey, property, parent, parentKey, isIdentifier) {
  var newKey = undefined;
  if (_lodash2.default.startsWith(oldKey, '&')) {
    newKey = oldKey.split('&').join(parentKey);
  } else {
    newKey = parentKey + ' ' + oldKey;
  }
  if (isIdentifier) {
    property.key.type = 'Literal';
  }
  property.key.value = newKey.trim();
  var index = _lodash2.default.findIndex(parent.properties, function (p) {
    return p.key && (p.key.value === property.key.value || p.key.name === property.key.value);
  });
  if (index === -1) {
    parent.properties.push(property);
  } else {
    var value = parent.properties[index].value;
    addToNode(value, property.value);
  }
}

function flat(property, parent, parentKey, isIdentifier, object, isFirst) {
  var oldKey = property.key.value || property.key.name || '';
  var tempObject = object.value ? object.value : object;
  var parentOfParent = property.parent.parent;
  if (parentKey === 'mediaQueries' || parentOfParent && parentOfParent.key && parentOfParent.key.name === 'mediaQueries') {
    return [tempObject, true];
  }

  if (_lodash2.default.includes(parentKey, '@media')) {
    return [parent, false];
  }
  if (property.visited) {
    return [parent, false];
  }
  if (_lodash2.default.includes(oldKey, ',')) {
    _lodash2.default.forEach(oldKey.split(','), function (key) {
      var trimmedKey = key.trim();
      var newProp = _lodash2.default.cloneDeep(property);
      newProp.key.value = trimmedKey;
      addToParent(trimmedKey, newProp, parent, parentKey, isIdentifier);
    });
    tempObject.properties = _lodash2.default.without(tempObject.properties, property);
    if (property.value.type === 'ObjectExpression') {
      _lodash2.default.forEach(property.value.properties, function (p) {
        p.visited = true;
      });
    }
    return true;
  } else if (!isFirst) {
    property.visited = true;
    addToParent(oldKey, property, parent, parentKey, isIdentifier);
    tempObject.properties = _lodash2.default.without(tempObject.properties, property);
  }
  return [parent, false];
}

function flatten(object, parent, parentKey, isFirst, rawSkipNextFlat) {
  var skipNextFlat = rawSkipNextFlat;
  var redoParent = false;
  if (!object) {
    return;
  }
  var tempObject = object.value ? object.value : object;
  _lodash2.default.forEach(tempObject.properties, function (p) {
    var newParent = tempObject;
    var resetSkip = true;
    p.parent = object;
    if (!skipNextFlat && (p.key.type === 'Literal' || p.key.type === 'Identifier') && (p.value.type === 'ObjectExpression' || p.value.type === 'CallExpression' && (p.value.callee && (p.value.callee.name === '_extends' || p.value.callee.name === 'extends') || p.value.callee.property && (p.value.callee.property.name === '_extends' || p.value.callee.property.name === 'extends'))) && parent) {
      var flatResults = flat(p, parent, parentKey, p.key.type === 'Identifier', object, isFirst);
      if (flatResults === true) {
        redoParent = true;
      } else {
        newParent = flatResults[0];
        skipNextFlat = flatResults[1];
        if (skipNextFlat) {
          resetSkip = false;
        }
      }
    }
    if (resetSkip) {
      skipNextFlat = false;
    }
    if (p.value.type === 'ObjectExpression') {
      flatten(p, newParent, p.key.value || p.key.name, false, skipNextFlat);
    } else if (p.value.type === 'CallExpression') {
      _lodash2.default.forEach(p.value.arguments, function (a) {
        if (a.type === 'ObjectExpression') {
          flatten(a, newParent, p.key.value || p.key.name, false, skipNextFlat);
        }
      });
    }
  });
  object.properties = _lodash2.default.filter(object.properties, function (p) {
    if (p.value && p.value.properties && _lodash2.default.isEmpty(p.value.properties)) {
      return false;
    }
    return true;
  });
  if (redoParent) {
    flatten(parent, null, null, false, false);
  }
}

function main(content) {
  if (this.cacheable) {
    this.cacheable();
  }

  var tree = (0, _acorn.parse)(content, {
    ecmaVersion: 6,
    sourceType: 'module'
  });
  var exportNode = getExportsNode(tree.body);
  flatten(exportNode, exportNode, '', true);
  return _escodegen2.default.generate(tree);
}

main.getExportsNode = getExportsNode;
main.addToObjectExpressionToCallExpression = addToObjectExpressionToCallExpression;
main.addToNode = addToNode;
main.addToParent = addToParent;
main.flat = flat;
main.flatten = flatten;

module.exports = main;