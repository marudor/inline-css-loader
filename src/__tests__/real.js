import fs from 'fs';
import { normalizeInput, runLoader, readFile } from '../testHelper';
import path from 'path';


describe('real Examples', () => {
  const tests = fs.readdirSync(path.resolve(__dirname, 'real'));
  tests
  .map(testFolder => ({
    name: testFolder,
    inp: readFile(`real/${testFolder}/input`),
    out: readFile(`real/${testFolder}/output`),
  }))
  .forEach(testFolder => {
    it(testFolder.name, () => {
      const out = normalizeInput(testFolder.out);
      expect(out).toBe(runLoader(testFolder.inp));
    });
  });
});
