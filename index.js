var acorn = require('acorn');
var _ = require('lodash');
var escodegen = require('escodegen');

function getExportsNode(nodes) {
  var result;
  _.some(nodes, function(node) {
    var exp = node.expression
    if (exp && exp.type === 'AssignmentExpression' && exp.left.type === 'MemberExpression' && exp.left.object.name === 'exports') {
      if (exp.right.type === 'ObjectExpression') {
        result = exp.right;
        return true;
      } else if (exp.right.type === 'CallExpression') {
        result = _.last(exp.right.arguments);
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
      var oldProps = _.clone(parentNode.properties);
      _.extend(parentNode, childNode);
      addToObjectExpressionToCallExpression(parentNode, {properties: oldProps});
    }
  } else if (parentNode.type === 'CallExpression') {
    if (childNode.type === 'ObjectExpression') {
      addToObjectExpressionToCallExpression(parentNode, childNode);
    } else if (childNode.type === 'CallExpression') {
      parentNode.arguments.push(childNode.arguments[1]);
      if (choldNode.arguments.length > 2) {
        parentNode.arguments.push(childNode.arguments[2]);
      }
    }
  }
}

function addToParent(oldKey, property, parent, parentKey, isIdentifier) {
  var newKey;
  if (_.startsWith(oldKey, '&')) {
    newKey = oldKey.split('&').join(parentKey);
  } else {
    newKey = parentKey + ' ' + oldKey;
  }
  if (isIdentifier) {
    property.key.type = 'Literal';
  }
  property.key.value = newKey.trim();
  var index = _.findIndex(parent.properties, function(p) {
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
  if (oldKey === 'abba') {
    console.log(parentKey);
  }
  if (parentKey === 'mediaQueries') {
    return [object, true];
  }

  if (_.contains(oldKey, '@media')) {
    return [parent, false];
  }
  if (_.contains(oldKey, ',')) {
    _.each(oldKey.split(','), function(key) {
      key = key.trim();
      addToParent(key, _.cloneDeep(property), parent, parentKey, isIdentifier);
    });
    object.properties = _.without(object.properties, property);
  } else if (!isFirst) {
    addToParent(oldKey, property, parent, parentKey, isIdentifier);
    object.properties = _.without(object.properties, property);
  }
  return [parent, false];
}

function flatten(object, parent, parentKey, isFirst, skipNextFlat) {
  _.each(object.properties, function(p) {
    var newParent = object;
    var resetSkip = true;
    if (!skipNextFlat && (p.key.type === 'Literal' || p.key.type === 'Identifier') && (p.value.type === 'ObjectExpression' || (p.value.type === 'CallExpression' && p.value.callee.property.name === '_extends')) && parent) {
      var flatResults = flat(p, parent, parentKey, p.key.type === 'Identifier', object, isFirst);
      newParent = flatResults[0];
      skipNextFlat = flatResults[1];
      if (skipNextFlat) {
        resetSkip = false;
      }
    }
    if (resetSkip) {
      skipNextFlat = false;
    }


    if (p.value.type === 'ObjectExpression') {
      flatten(p.value, newParent, p.key.value || p.key.name, false, skipNextFlat);
    } else if (p.value.type === 'CallExpression') {
      _.each(p.value.arguments, function(a) {
        if (a.type === 'ObjectExpression') {
          flatten(a, newParent, p.key.value || p.key.name, false, skipNextFlat);
        }
      });
    }
  });
  object.properties = _.filter(object.properties, function(p) {
    if (p.value && p.value.properties && _.isEmpty(p.value.properties)) {
      return false;
    }
    return true;
  })
}

module.exports = function(content, map) {
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
