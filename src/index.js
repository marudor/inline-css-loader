import { parse } from 'babylon';
import generate from 'babel-generator';
import traverse from 'babel-traverse';

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

  if (parentKeyName === '') {
    return [];
  }

  let andReplacer;
  const parentParts = parentKeyName.split(' ');
  if (pathKeyName.includes('&')) {
    andReplacer = parentParts.pop();
  }



  const newKey = `${parentParts.join(' ')} ${pathKeyName.replace('&', andReplacer)}`.trim();
  const newNode = node.__clone();
  newNode.key = node.key.__clone();
  newNode.key.value = newKey;
  newNode.key.type = 'StringLiteral';
  newNode.value = node.value.__clone();
  return [newNode];
}

let root;
let mediaRoot;

const splitMultipleVisitor = {
  ObjectProperty: {
    exit(path) {
      if (path.data.remove) {
        path.remove();
      }
    },
    enter(path) {
      const parent = path.parentPath.parent;
      if (!path.node.key) {
        return;
      }
      if (path.node.value.type !== 'ObjectExpression') {
        if (path.node.value.type !== 'CallExpression' || path.node.value.callee.name !== '_extends') {
          return;
        }
      }
      const pathKeyName = (path.node.key.value || path.node.key.name);
      const parentKeyName = parent.key ? (parent.key.value || parent.key.name) : '';
      if ((parent.type === 'ObjectProperty' || isMainChild(path)) && pathKeyName && parentKeyName != null) {
        if (pathKeyName.includes(',')) {
          const newKeys = pathKeyName.split(',');
          path.replaceWithMultiple(newKeys.map(key => {
            const cloned = path.node.__clone();
            cloned.key = cloned.key.__clone();
            cloned.key.value = key.trim();
            cloned.key.type = 'StringLiteral';
            return cloned;
          }));
        }
      }
    },
  },
};

const flattenVisitor = {
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
        return;
      }
      if (path.node.value.type !== 'ObjectExpression') {
        if (path.node.value.type !== 'CallExpression' || path.node.value.callee.name !== '_extends') {
          return;
        }
      }
      const pathKeyName = (path.node.key.value || path.node.key.name);
      const parentKeyName = parent.key ? (parent.key.value || parent.key.name) : '';
      //console.log(pathKeyName, '||', parentKeyName);
      if ((parent.type === 'ObjectProperty' || isMainChild(path)) && pathKeyName && parentKeyName != null) {
        const parentParts = parentKeyName.split(' ');
        if (parentParts.includes('mediaQueries') || path.parentPath.data.isMedia) {
          path.data.isMedia = true;
          return;
        }
        if (path.parentPath.parentPath.data.isMedia) {
          return;
        }

        let remove = false;
        getNewNodes(path.node, parent).forEach(n => {
          if (path.parentPath.parentPath.data.isMedia || path.parentPath.parentPath.parentPath.parentPath.data.isMedia) {
            mediaRoot.insertAfter(n);
          } else {
            root.insertAfter(n);
          }
          remove = true;
        });
        if (remove) {
          path.remove();
        }
      }
    },
  },
};

const removeEmptyVisitor = {
  ObjectProperty: {
    exit(path) {
      if (path.node.value.type === 'ObjectExpression' && !path.node.value.properties.length) {
        path.remove();
      }
    },
  },
};

let keys = [];
const removeDuplicateVisitor = {
  ObjectProperty(path) {
    const key = path.node.key.value || path.node.key.name;
    path.skip();
    if (keys.includes(key)) {
      path.remove();
    } else {
      keys.push(key);
    }
  },
};

function generateTree(content) {
  let tree = parse(content, {
    sourceType: 'module',
  });
  traverse(tree, splitMultipleVisitor);
  tree = parse(generate(tree, {}, content).code, {
    sourceType: 'module',
  });
  traverse(tree, flattenVisitor);
  tree = parse(generate(tree, {}, content).code, {
    sourceType: 'module',
  });
  traverse(tree, removeEmptyVisitor);
  tree = parse(generate(tree, {}, content).code, {
    sourceType: 'module',
  });
  keys = [];
  traverse(tree, removeDuplicateVisitor);
  return tree;
}

function main(content) {
  if (this.cacheable) {
    this.cacheable();
  }

  return generate(generateTree(content), this.generateOptions || {}, content).code;
}
module.exports = main;
module.exports.splitMultipleVisitor = splitMultipleVisitor;
module.exports.flattenVisitor = flattenVisitor;
module.exports.removeEmptyVisitor = removeEmptyVisitor;
module.exports.removeDuplicateVisitor = removeDuplicateVisitor;
module.exports.generateTree = generateTree;
