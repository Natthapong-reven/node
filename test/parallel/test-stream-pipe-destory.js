'use strict';

require('../common');
const { Readable, Writable } = require('stream');
const { setImmediate } = require('node:timers/promises');
const assert = require('assert');

async function * asyncGenerator() {
  yield '1';
  await setImmediate();
  yield '2';
  await setImmediate();
  yield '3';
}

{
  class NullWritable extends Writable {
    _write(c, e, cb) {
      cb();
    }
  }

  const src = Readable.from(asyncGenerator());
  const dest = new NullWritable();
  src.on('error', () => {});
  dest.on('error', () => {});

  src.pipe(dest);

  process.nextTick(() => {
    src.emit('error', new Error('Error'));
  });

  process.nextTick(() => {
    setImmediate(() => {
      assert.strictEqual(src.destroyed, true);
      assert.strictEqual(dest.destroyed, true);
      assert.strictEqual(src.closed, true);
      assert.strictEqual(dest.closed, true);
    });
  });
}
