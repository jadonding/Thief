const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');

function loadStockUtils() {
  const filename = path.resolve(__dirname, '../src/main/utils/stock.js');
  const transformed = fs
    .readFileSync(filename, 'utf8')
    .replace(/export default stockUtils;\s*$/, 'module.exports = stockUtils;');

  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = function requireForTest(request) {
    if (request === 'superagent') return {};
    if (request === 'superagent-charset') return function noop() {};
    return originalRequire(request);
  };
  mod._compile(transformed, filename);
  return mod.exports;
}

const stockUtils = loadStockUtils();

assert.strictEqual(typeof stockUtils.formatStockQuoteText, 'function');

assert.strictEqual(
  stockUtils.formatStockQuoteText({
    stockName: 'ST京机',
    currPrice: '9.07',
    percentage: '0.44',
    buy1AmountText: '15.7818W',
    showBuy1Amount: true
  }),
  'ST京机  9.07/0.44%  15.7818W\n'
);

assert.strictEqual(
  stockUtils.formatStockQuoteText({
    stockName: 'ST京机',
    currPrice: '9.07',
    percentage: '0.44',
    buy1AmountText: '15.7818W',
    showBuy1Amount: false
  }),
  'ST京机  9.07/0.44%\n'
);

console.log('stock format tests passed');
