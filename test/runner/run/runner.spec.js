import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'

import Benchmrk from '../../../index.js'

test('Benchmrk', async t => {
  let runner

  await t.test('#run', async t => {
    before(() => {
      runner = new Benchmrk()
    })

    await t.test('instantiates ok without parameters', t => {
      assert.ok(runner)
    })
  })
})
