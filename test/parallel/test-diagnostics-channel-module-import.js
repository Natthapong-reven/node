'use strict';
const common = require('../common');
const assert = require('assert');
const dc = require('diagnostics_channel');

const trace = dc.tracingChannel('module.import');
const events = [];
let lastEvent;

function track(name) {
  return (event) => {
    // Verify every event after the first is the same object
    if (events.length) {
      assert.strictEqual(event, lastEvent);
    }
    lastEvent = event;

    events.push({ name, ...event });
  };
}

trace.subscribe({
  start: common.mustCall(track('start')),
  end: common.mustCall(track('end')),
  asyncStart: common.mustCall(track('asyncStart')),
  asyncEnd: common.mustCall(track('asyncEnd')),
  error: common.mustNotCall(track('error')),
});

import('http').then(
  common.mustCall((result) => {
    // Verify order and contents of each event
    assert.deepStrictEqual(events, [
      {
        name: 'start',
        parentURL: `file://${module.filename}`,
        url: 'http',
      },
      {
        name: 'end',
        parentURL: `file://${module.filename}`,
        url: 'http',
      },
      {
        name: 'asyncStart',
        parentURL: `file://${module.filename}`,
        url: 'http',
        result,
      },
      {
        name: 'asyncEnd',
        parentURL: `file://${module.filename}`,
        url: 'http',
        result,
      },
    ]);
  }),
  common.mustNotCall(),
);
