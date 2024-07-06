import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner

  await t.test('#run', async t => {
    before(() => {
      runner = new PerformanceRunner()
    })

    await t.test('instantiates ok without parameters', t => {
      assert.ok(runner)
    })
  })
})
