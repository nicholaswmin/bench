import assert from 'node:assert'
import { setTimeout } from 'timers/promises'
import { mock, test, before, beforeEach } from 'node:test'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner = null, result = null, rows = null, foo = null, bar = null

  await t.test('#toPlots', async t => {
    await beforeEach(async () => {
      runner = new PerformanceRunner()
    })

    await t.test('when run before runner.run() has ended', async t => {
      await t.test('throws an error', async t => {
        assert.throws(t => runner.toPlots())
      })
    })

    await t.test('when run after runner.run() has ended', async t => {
      await beforeEach(async () => {
        await runner.run([
          { name: 'foo', cycles: 2, fn: () => {} }
        ])
      })

      await t.test('does not throw', async t => {
        assert.doesNotThrow(t => runner.toPlots())
      })
    })
  })
})
