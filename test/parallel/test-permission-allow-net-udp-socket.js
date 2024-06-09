'use strict';

require('../common');

const { spawnSync } = require('child_process');
const assert = require('assert');

function case1() {
  const assert = require('assert');
  const dgram = require('dgram');
  {
    const socket = dgram.createSocket('udp4');
    socket.bind().on('listening', (err) => {
      assert.ok(!err);
      socket.close();
    });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(9999)
      .on('listening', () => {
        socket.close();
      })
      .on('error', (err) => {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(9999, 'localhost')
      .on('listening', () => {
        socket.close();
      })
      .on('error', (err) => {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.connect(9999, '127.0.0.1', (err) => {
      if (err) {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
      }
      socket.close();
    });
  }
}
{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp=*',
      '-e',
      `(${case1.toString()})()`,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}

function case2() {
  const assert = require('assert');
  const dgram = require('dgram');
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(8888, '127.0.0.1')
      .on('listening', () => {
        socket.close();
      })
      .on('error', (err) => {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(9999, '127.0.0.1')
      .on('listening', () => {
        socket.close();
      })
      .on('error', (err) => {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(9999, '127.0.0.2')
      .on('error', (err) => {
        assert.ok(err.code === 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
}

{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp=127.0.0.1/9999',
      '--allow-net-udp-in=127.0.0.1/8888',
      '-e',
      `(${case2.toString()})()`,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}

function case3() {
  const assert = require('assert');
  const dgram = require('dgram');
  {
    const socket = dgram.createSocket('udp4');
    socket.connect(8888, '127.0.0.1', (err) => {
      if (err) {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
      }
      socket.close();
    });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.connect(9999, '127.0.0.1', (err) => {
      if (err) {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
      }
      socket.close();
    });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.connect(9999, '127.0.0.2', (err) => {
      assert.ok(err.code === 'ERR_ACCESS_DENIED', err.message);
      socket.close();
    });
  }
}
{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp-in=*',
      '--allow-net-udp-out=127.0.0.1/8888,127.0.0.1/9999',
      '-e',
      `(${case3.toString()})()`,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}

function case4() {
  const assert = require('assert');
  const dgram = require('dgram');
  const message = Buffer.from('hello');
  {
    const socket = dgram.createSocket('udp4');
    socket.send(message, 8888, '127.0.0.1', (err) => {
      if (err) {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
      }
      socket.close();
    });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.send(message, 9999, 'localhost', (err) => {
      if (err) {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
      }
      socket.close();
    });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.send(message, 7777, 'localhost', (err) => {
      assert.ok(err.code === 'ERR_ACCESS_DENIED', err.message);
      socket.close();
    });
  }
}
{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp-in=*',
      '--allow-net-udp-out=127.0.0.1/8888',
      '--allow-net-udp-out=localhost/9999',
      '-e',
      `(${case4.toString()})()`,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}

function case5() {
  const assert = require('node:assert');
  const dgram = require('dgram');

  const tests = [
    // [port, ip]
    [],
    [9999],
    [9999, '127.0.0.1'],
    [9999, 'localhost'],
  ];

  tests.forEach((test, i) => {
    const socket = dgram.createSocket('udp4');
    socket.bind(test[0], test[1]).on('error', (err) => {
      assert.ok(err.code === 'ERR_ACCESS_DENIED', err.message);
      socket.close();
    });
  });
}
{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '-e',
      `(${case5.toString()})()`,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}

function case6() {
  const assert = require('assert');
  const dgram = require('dgram');
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(8888)
      .on('listening', () => {
        socket.close();
      })
      .on('error', (err) => {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(8888, '127.0.0.1')
      .on('listening', () => {
        socket.close();
      })
      .on('error', (err) => {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(5555, 'localhost')
      .on('listening', () => {
        socket.close();
      })
      .on('error', (err) => {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
  {
    const socket = dgram.createSocket('udp4');
    socket.bind(6666, 'localhost')
      .on('listening', () => {
        socket.close();
      })
      .on('error', (err) => {
        assert.ok(err.code !== 'ERR_ACCESS_DENIED', err.message);
        socket.close();
      });
  }
}
{
  const { status, stderr } = spawnSync(
    process.execPath,
    [
      '--experimental-permission',
      '--allow-net-udp-in=*/8888',
      '--allow-net-udp-in=localhost/*',
      '-e',
      `(${case6.toString()})()`,
    ]
  );
  if (status !== 0) {
    console.error(stderr.toString());
  }
  assert.strictEqual(status, 0);
}
