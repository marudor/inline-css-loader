import { parse } from 'babylon';
import generate from 'babel-generator';
import traverse from 'babel-traverse';
import t from 'babel-types';

function parentIsRoot(path) {
  const parent = path.parentPath.parent;
  if (parent.type === 'ExportDefaultDeclaration') {
    return true;
  }
  if (parent.type === 'AssignmentExpression' && parent.left.type === 'MemberExpression' && parent.left.object.name === 'exports') {
    return true;
  }
}

function parentIsMediaRoot(path) {
  const parent = path.parentPath.parentPath.parentPath.parent;
  if (parent.type === 'ObjectProperty' && parent.key.name === 'mediaQueries') {
    return true;
  }
}

function isMainChild(path) {
  //return false;
  return path.parentPath.parent.type === 'AssignmentExpression' && path.parentPath.parent.left.object.name === 'exports';
}

function getNewNodes(node, parent) {
  const parentKeyName = parent.key ? (parent.key.value || parent.key.name) : '';
  const pathKeyName = (node.key.value || node.key.name);
  if (pathKeyName.includes(',')) {
    const newKeys = pathKeyName.split(',');
    const newNodes = [];
    newKeys.forEach(newKey => {
      const cloned = node.__clone();
      cloned.key = cloned.key.__clone();
      cloned.key.value = newKey.trim();
      cloned.key.type = 'StringLiteral';
      cloned.value = cloned.value.__clone();
      newNodes.push(cloned);
    });
    return newNodes;
  }

  if (parentKeyName === '') {
    return [];
  }

  let andReplacer;
  const parentParts = parentKeyName.split(' ');
  if (pathKeyName.includes('&')) {
    andReplacer = parentParts.pop();
  }
  if (node.__skip) {
    return [];
  }


  const newKey = `${parentParts.join(' ')} ${pathKeyName.replace('&', andReplacer)}`.trim();
  const newNode = node.__clone();
  newNode.key = node.key.__clone();
  newNode.key.value = newKey;
  newNode.key.type = 'StringLiteral';
  newNode.value = node.value.__clone();
  newNode.__skip = true;
  return [newNode];
}

let root;
let mediaRoot;
const visitor = {
  ObjectProperty: {
    exit(path) {
      if (path.data.remove) {
        path.remove();
      }
    },
    enter(path) {
      const parent = path.parentPath.parent;
      if (parent && parentIsRoot(path)) {
        root = path;
      }
      if (parent && path.parentPath.parentPath && parentIsMediaRoot(path)) {
        mediaRoot = path;
      }
      if (!path.node.key) {
        console.log('noNodeKey', path);
        return;
      }
      if (path.node.value.type !== 'ObjectExpression') {
        console.log('notObjectExpression', path);
        return;
      }
      const pathKeyName = (path.node.key.value || path.node.key.name);
      const parentKeyName = parent.key ? (parent.key.value || parent.key.name) : '';
      console.log(pathKeyName, '||', parentKeyName);
      if ((parent.type === 'ObjectProperty' || isMainChild(path)) && pathKeyName && parentKeyName != null) {
        const parentParts = parentKeyName.split(' ');
        if (parentParts.includes('mediaQueries') || path.parentPath.data.isMedia) {
          path.data.isMedia = true;
          return;
        }
        if (path.parentPath.parentPath.data.isMedia) {
          return;
        }

        getNewNodes(path.node, parent).forEach(n => {
          if (path.parentPath.parentPath.data.isMedia || path.parentPath.parentPath.parentPath.parentPath.data.isMedia) {
            mediaRoot.insertAfter(n);
          } else {
            root.insertAfter(n);
          }
        });
      } else {
        console.log('mainIfFailed', path);
        console.log(root);
      }
    },
  },
};


function main(content) {
  if (this.cacheable) {
    this.cacheable();
  }

  const tree = parse(content, {
    sourceType: 'module',
  });
  traverse(tree, visitor);
  return generate(tree, {}, content).code;
}
module.visitor = visitor;
module.exports = main;
