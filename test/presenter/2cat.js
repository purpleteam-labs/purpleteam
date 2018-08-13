// const cwd = process.cwd();
// require('app-module-path').addPath(cwd);
exports.lab = require('lab').script();

const { describe, it } = exports.lab;

const { expect } = require('code');

describe('apiDecoratingAdapter', () => {
  debugger; // eslint-disable-line
  it('returns true when 1 + 1 equals 2', () => {
    expect(1 + 1).to.equal(2);
  });
});

