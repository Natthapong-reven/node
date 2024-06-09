'use strict';

const common = require('../common');

const { spawnSync } = require('child_process');
const assert = require('assert');

common.skipIfWorker();

{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp-out=*',
      '-e',
      `
        const assert = require('assert');
        assert.ok(process.permission.has('net.udp.out'));
        assert.ok(process.permission.has('net.udp.out', 'localhost'));
        assert.ok(process.permission.has('net.udp.out', '127.0.0.1/*'));
        assert.ok(process.permission.has('net.udp.out', '127.0.0.1/9999'));
        assert.ok(process.permission.has('net.udp.out', '*/9999'));
        assert.ok(!process.permission.has('net.udp.in'));
        assert.ok(!process.permission.has('net.udp.in', 'localhost'));
        assert.ok(!process.permission.has('net.udp.in', '127.0.0.1/*'));
        assert.ok(!process.permission.has('net.udp.in', '127.0.0.1/9999'));
        assert.ok(!process.permission.has('net.udp.in', '*/9999'));
      `,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}

{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp-out=*/9999',
      '-e',
      `
        const assert = require('assert');
        assert.ok(process.permission.has('net.udp.out', '127.0.0.1/9999'));
        assert.ok(process.permission.has('net.udp.out', '*/9999'));
        assert.ok(!process.permission.has('net.udp.out', '127.0.0.1/8888'));
        assert.ok(!process.permission.has('net.udp.out', '*/8888'));
        assert.ok(!process.permission.has('net.udp.in', '127.0.0.1/9999'));
      `,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}

{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp-out=127.0.0.1/*',
      '-e',
      `
        const assert = require('assert');
        assert.ok(process.permission.has('net.udp.out', '127.0.0.1/9999'));
        assert.ok(process.permission.has('net.udp.out', '127.0.0.1/*'));
        assert.ok(!process.permission.has('net.udp.out', '127.0.0.2/9999'));
        assert.ok(!process.permission.has('net.udp.in', '127.0.0.1/9999'));
      `,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}

{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp-out=127.0.0.1/9999',
      '-e',
      `
        const assert = require('assert');
        assert.ok(process.permission.has('net.udp.out', '127.0.0.1/9999'));
        assert.ok(!process.permission.has('net.udp.out', '127.0.0.1/8888'));
        assert.ok(!process.permission.has('net.udp.out', '127.0.0.2/9999'));
        assert.ok(!process.permission.has('net.udp.in', '127.0.0.1/9999'));
      `,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}
