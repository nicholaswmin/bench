import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'

import Bench from '../../../index.js'

test('Bench', async t => {
  let runner

  await t.test('#run', async t => {
    before(() => {
      runner = new Bench()
    })

    await t.test('instantiates ok without parameters', t => {
      assert.ok(runner)
    })
  })
})
