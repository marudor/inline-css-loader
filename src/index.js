import acorn from 'acorn';
import _ from 'lodash';
import escodegen from 'escodegen';

function getExportsNode(nodes) {
  let result;
  _.some(nodes, node => {
    const exp = node.expression;
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
      const oldProps = _.clone(parentNode.properties);
      _.extend(parentNode, childNode);
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
  const index = _.findIndex(parent.properties, p => {
    return p.key && (p.key.value === property.key.value || p.key.name === property.key.value);
  });
  if (index !== -1) {
    const value = parent.properties[index].value;
    addToNode(value, property.value);
  } else {
    parent.properties.push(property);
  }
}

function flat(property, parent, parentKey, isIdentifier, object, isFirst) {
  const oldKey = property.key.value || property.key.name || '';
  if (parentKey === 'mediaQueries') {
    return [object, true];
  }

  if (_.contains(oldKey, '@media')) {
    return [parent, false];
  }
  if (_.contains(oldKey, ',')) {
    _.each(oldKey.split(','), key => {
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
  _.each(object.properties, p => {
    let newParent = object;
    let resetSkip = true;
    let skipFlat = skipNextFlat;
    if (!skipFlat && (p.key.type === 'Literal' || p.key.type === 'Identifier') && (p.value.type === 'ObjectExpression' || (p.value.type === 'CallExpression' && p.value.callee.property.name === '_extends')) && parent) {
      const flatResults = flat(p, parent, parentKey, p.key.type === 'Identifier', object, isFirst);
      newParent = flatResults[0];
      skipFlat = flatResults[1];
      if (skipFlat) {
        resetSkip = false;
      }
    }
    if (resetSkip) {
      skipFlat = false;
    }


    if (p.value.type === 'ObjectExpression') {
      flatten(p.value, newParent, p.key.value || p.key.name, false, skipFlat);
    } else if (p.value.type === 'CallExpression') {
      _.each(p.value.arguments, a => {
        if (a.type === 'ObjectExpression') {
          flatten(a, newParent, p.key.value || p.key.name, false, skipFlat);
        }
      });
    }
  });
  object.properties = _.filter(object.properties, p => {
    if (p.value && p.value.properties && _.isEmpty(p.value.properties)) {
      return false;
    }
    return true;
  });
}

export default (content, map) => {
  if (this.cacheable) {
    this.cacheable();
  }

  const tree = acorn.parse(content, {
    ecmaVersion: 6,
    sourceType: 'module'
  });
  const exportNode = getExportsNode(tree.body);
  flatten(exportNode, exportNode, '', true);
  return escodegen.generate(tree);
};
