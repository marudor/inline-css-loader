import _ from 'lodash';
import { parse } from 'acorn';
import escodegen from 'escodegen';

function getExportsNode(nodes) {
  let result;
  _.some(nodes, (node) => {
    if (node.type === 'ExportDefaultDeclaration') {
      result = node.declaration;
      return true;
    }
    if (node.type === 'VariableDeclaration') {
      const declaration = node.declarations[0];
      if (declaration.id.name === '_unused_webpack_default_export') {
          result = declaration.init;
          return true;
      }
    }
    const exp = node.expression;
    if (exp && exp.type === 'AssignmentExpression' && exp.left.type === 'MemberExpression' && (exp.left.object.name === 'exports' || exp.left.property.name === 'exports')) {
      if (exp.right.type === 'ObjectExpression') {
        result = exp.right;
        return true;
      } else if (exp.right.type === 'CallExpression') {
        result = _.last(exp.right.arguments.filter(a => a.type === 'ObjectExpression'));
        return true;
      }
    }
  });
  if (result && result.type === 'CallExpression') {
    const expressions = result.arguments.filter(a => a.type === 'ObjectExpression');
    result = _.last(expressions);
  }
  return result;
}

function addToObjectExpressionToCallExpression(call, object) {
  if (object.properties) {
    if (call.arguments.length > 2) {
      call.arguments[2].properties = call.arguments[2].properties.concat(object.properties);
    } else {
      call.arguments.push({
        type: 'ObjectExpression',
        properties: object.properties,
      });
    }
  }
}

function addToNode(parentNode, childNode) {
  if (parentNode.type === 'ObjectExpression') {
    if (childNode.type === 'ObjectExpression') {
      const childNodeKeys = _.map(childNode.properties, p => p.key);
      parentNode.properties = _.filter(parentNode.properties, p => p.key && _.includes(childNodeKeys, p.key.name));
      parentNode.properties = parentNode.properties.concat(childNode.properties);
    } else if (childNode.type === 'CallExpression') {
      const oldProps = _.clone(parentNode.properties);
      _.extend(parentNode, childNode);
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
  let newKey;
  if (_.startsWith(oldKey, '&')) {
    newKey = oldKey.split('&').join(parentKey);
  } else {
    newKey = `${parentKey} ${oldKey}`;
  }
  if (isIdentifier) {
    property.key.type = 'Literal';
  }
  property.key.value = newKey.trim();
  const index = _.findIndex(parent.properties, (p) => p.key && (p.key.value === property.key.value || p.key.name === property.key.value));
  if (index === -1) {
    parent.properties.push(property);
  } else {
    const value = parent.properties[index].value;
    addToNode(value, property.value);
  }
}

function flat(property, parent, parentKey, isIdentifier, object, isFirst) {
  const oldKey = property.key.value || property.key.name || '';
  const tempObject = object.value ? object.value : object;
  const parentOfParent = property.parent.parent;
  if (parentKey === 'mediaQueries' || (parentOfParent && parentOfParent.key && parentOfParent.key.name === 'mediaQueries')) {
    return [tempObject, true];
  }

  if (_.includes(parentKey, '@media')) {
    return [parent, false];
  }
  if (property.visited) {
    return [parent, false];
  }
  if (_.includes(oldKey, ',')) {
    _.forEach(oldKey.split(','), (key) => {
      const trimmedKey = key.trim();
      const newProp = _.cloneDeep(property);
      newProp.key.value = trimmedKey;
      addToParent(trimmedKey, newProp, parent, parentKey, isIdentifier);
    });
    tempObject.properties = _.without(tempObject.properties, property);
    if (property.value.type === 'ObjectExpression') {
      _.forEach(property.value.properties, (p) => {
        p.visited = true;
      });
    }
    return true;
  } else if (!isFirst) {
    property.visited = true;
    addToParent(oldKey, property, parent, parentKey, isIdentifier);
    tempObject.properties = _.without(tempObject.properties, property);
  }
  return [parent, false];
}

function flatten(object, parent, parentKey, isFirst, rawSkipNextFlat) {
  let skipNextFlat = rawSkipNextFlat;
  let redoParent = false;
  if (!object) {
    return;
  }
  const tempObject = object.value ? object.value : object;
  _.forEach(tempObject.properties, (p) => {
    let newParent = tempObject;
    let resetSkip = true;
    p.parent = object;
    if (!skipNextFlat && (p.key.type === 'Literal' || p.key.type === 'Identifier') && (p.value.type === 'ObjectExpression' || (p.value.type === 'CallExpression' && ((p.value.callee && (p.value.callee.name === '_extends' || p.value.callee.name === 'extends')) || (p.value.callee.property && (p.value.callee.property.name === '_extends' || p.value.callee.property.name === 'extends'))))) && parent) {
      const flatResults = flat(p, parent, parentKey, p.key.type === 'Identifier', object, isFirst);
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
      _.forEach(p.value.arguments, (a) => {
        if (a.type === 'ObjectExpression') {
          flatten(a, newParent, (p.key.value || p.key.name), false, skipNextFlat);
        }
      });
    }
  });
  object.properties = _.filter(object.properties, (p) => {
    if (p.value && p.value.properties && _.isEmpty(p.value.properties)) {
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

  const tree = parse(content, {
    ecmaVersion: 6,
    sourceType: 'module',
  });
  const exportNode = getExportsNode(tree.body);
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
