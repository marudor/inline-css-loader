export const input = `
export default {
  '.foo': {
    '.batz, .bar': {
      right: 5,
    },
    '.bar': {
      right: 15,
    }
  }
};`

export const output = `
export default {
  '.foo .batz': {
    right: 5,
  },
  '.foo .bar': {
    right: 15,
  }
};`
