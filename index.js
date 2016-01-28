var acorn = require('acorn');
var escodegen = require('escodegen');
var isEmpty = require('lodash.isempty');
var cloneDeep = require('lodash.cloneDeep');
var without = require('lodash.without');

function getExportsNode(nodes) {
  var result;
  nodes.some(function(node) {
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
        result = exp.right.arguments[exp.right.arguments.length - 1];
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
      parentNode.properties = parentNode.properties.concat(childNode.properties);
    } else if (childNode.type === 'CallExpression') {
      var oldProps = Object.assign({}, parentNode.properties);
      Object.assign(parentNode, childNode);
      addToObjectExpressionToCallExpression(parentNode, {properties: oldProps});
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
  var newKey;
  if (oldKey.indexOf('&') === 0) {
    newKey = oldKey.split('&').join(parentKey);
  } else {
    newKey = parentKey + ' ' + oldKey;
  }
  if (isIdentifier) {
    property.key.type = 'Literal';
  }
  property.key.value = newKey.trim();
  var index = parent.properties.findIndex(function(p) {
    return p.key && (p.key.value === property.key.value || p.key.name === property.key.value);
  });
  if (index !== -1) {
    var value = parent.properties[index].value;
    addToNode(value, property.value);
  } else {
    parent.properties.push(property);
  }
}

function flat(property, parent, parentKey, isIdentifier, object, isFirst) {
  var oldKey = property.key.value || property.key.name || '';
  const tempObject = object.value ? object.value : object;
  const parentOfParent = property.parent.parent;
  if (parentKey === 'mediaQueries' || (parentOfParent && parentOfParent.key && parentOfParent.key.name === 'mediaQueries')) {
    return [tempObject, true];
  }

  if (parentKey.indexOf('@media') !== -1) {
    return [parent, false];
  }
  if (property.visited) {
    return [parent, false];
  }
  if (oldKey.indexOf(',') !== -1) {
    oldKey.split(',').forEach(function(key) {
      key = key.trim();
      const newProp = cloneDeep(property);
      newProp.key.value = key;
      addToParent(key, newProp, parent, parentKey, isIdentifier);
    });
    tempObject.properties = without(tempObject.properties, property);
    if (property.value.type === 'ObjectExpression') {
      property.value.properties.forEach(function(p) {
        p.visited = true;
      });
    }
    return true;
  } else if (!isFirst) {
    property.visited = true;
    addToParent(oldKey, property, parent, parentKey, isIdentifier);
    tempObject.properties = without(tempObject.properties, property);
  }
  return [parent, false];
}

function flatten(object, parent, parentKey, isFirst, skipNextFlat) {
  var redoParent = false;
  const tempObject = object.value ? object.value : object;
  tempObject.properties.forEach(function(p) {
    var newParent = tempObject;
    var resetSkip = true;
    p.parent = object;
    if (!skipNextFlat && (p.key.type === 'Literal' || p.key.type === 'Identifier') && (p.value.type === 'ObjectExpression' || (p.value.type === 'CallExpression' && ((p.value.callee && (p.value.callee.name === '_extends' || p.value.callee.name === 'extends')) || (p.value.callee.property && (p.value.callee.property.name === '_extends' || p.value.callee.property.name === 'extends'))))) && parent) {
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
      flatten(p, newParent, (p.key.value || p.key.name), false, skipNextFlat);
    } else if (p.value.type === 'CallExpression') {
      p.value.arguments.forEach(function(a) {
        if (a.type === 'ObjectExpression') {
          flatten(a, newParent, (p.key.value || p.key.name), false, skipNextFlat);
        }
      });
    }
  });
  if (object.properties) {
    object.properties = object.properties.filter(function(p) {
      if (p.value && p.value.properties && isEmpty(p.value.properties)) {
        return false;
      }
      return true;
    });
  } else {
    object.properties = [];
  }
  if (redoParent) {
    flatten(parent, null, null, false, false);
  }
}

function main(content, map) {
  if (this.cacheable) {
    this.cacheable();
  }

  var tree = acorn.parse(content, {
    ecmaVersion: 6,
    sourceType: 'module'
  });
  var exportNode = getExportsNode(tree.body);
  flatten(exportNode, exportNode, '', true);
  return escodegen.generate(tree);
}

main.getExportsNode = getExportsNode;
main.addToObjectExpressionToCallExpression = addToObjectExpressionToCallExpression;
main.addToNode = addToNode;
main.addToParent = addToParent;
main.flat = flat;
main.flatten = flatten;

module.exports = main;
