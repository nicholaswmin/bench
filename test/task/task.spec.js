import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'

import Task from '../../src/task.js'

test('Task', async t => {
  let task

  await t.test('instantiation', async t => {
    before(() => {
      task = new Task({ name: 'foo', cycles: 10, fn: () => {} })
    })
    await t.test('instantiates ok if all parameters are ok', t => {
      assert.ok(task)
    })
  })

  await t.test('requires parameters to be present and valid', async t => {
    await t.test('"name" parameter', async t => {
      await t.test('throws if missing', async t => {
        assert.throws(() => {
          task = new Task({ cycles: 10, fn: () => {} })
        })

        await t.test('or is not a string', t => {
          assert.throws(() => {
            task = new Task({ name: 3, cycles: 10, fn: () => {} })
          })
        })

        await t.test('or does not have length', t => {
          assert.throws(() => {
            task = new Task({ name:'', cycles: 10, fn: () => {} })
          })
        })
      })
    })

    await t.test('"cycles" parameter', async t => {
      await t.test('throws if missing', async t => {
        assert.throws(() => {
          task = new Task({ name: 'foo', fn: () => {} })
        })

        await t.test('or is not a number', t => {
          assert.throws(() => {
            task = new Task({ name: 'foo', cycles: '0', fn: () => {} })
          })
        })

        await t.test('or is not positive', t => {
          assert.throws(() => {
            task = new Task({ name: 'foo', cycles: 0, fn: () => {} })
          })
        })
      })
    })

    await t.test('"fn" parameter', async t => {
      await t.test('throws if missing', async t => {
        assert.throws(() => {
          task = new Task({ name: 'foo', cycles: 10 })
        })

        await t.test('or is not a function', t => {
          assert.throws(() => {
            task = new Task({ name: 'foo', cycles: 10, fn: '() => {}' })
          })
        })
      })
    })
  })
})
