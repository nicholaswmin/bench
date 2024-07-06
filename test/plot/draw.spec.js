import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'
import { setTimeout } from 'timers/promises'

import CyclePlot from '../../src/cycle-plot/index.js'

test('CyclePlot', async t => {
  let i, plot, entries

  await t.test('#draw', async t => {
    await beforeEach(async t => {
      i = 0

      plot = new CyclePlot({
        name: 'Foo',
        entries: [
          {
            name: 'fn', startTime: 1, duration: 1, entryType: 'function',
            detail: [{ cycle: 1, taskname: 'foo' }]
          },

          {
            name: 'foo',
            startTime: 2, duration: 2, entryType: 'function', detail: []
          }
        ]
      })

      await plot.update(i++)
    })

    await t.test('does not throw', async t => {
      assert.doesNotThrow(t => plot.draw(i++))
    })

    await t.todo('draws a plot', async t => {
      // @TODO
    })
  })
})
