export const input = `
export default {
  '.foo': {
    'bar': {
      width: 100
    },
    '> batz': {
      width: 200
    },
    '&.bar': {
      width: 300
    }
  }
};`;
export const output = `
export default {
  '.foo bar': {
    width: 100
  },
  '.foo > batz': {
    width: 200
  },
  '.foo.bar': {
    width: 300
  }
};`;
