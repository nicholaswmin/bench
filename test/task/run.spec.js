import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'

import Task from '../../src/task.js'

test('Task', async t => {
  let task, mockFn

  await t.test ('#run', async t => {
    await t.beforeEach(async t => {
      mockFn = mock.fn()
      task = new Task({ name: 'foo', cycles: 10, fn: mockFn })
    })

    await t.test('runs x amount of times', async t => {
      await task.run()

      assert.strictEqual(mockFn.mock.callCount(), 10)
    })

    await t.test('records the runs in its "task.histogram"', async t => {
      await t.beforeEach(t => task.run())

      assert.ok(Object.hasOwn(task, 'histogram'))

      await t.test('of type RecordableHistogram', async t => {
        assert.strictEqual(
          task.histogram.constructor.name,
          'RecordableHistogram'
        )
      })

      await t.test('which was called 10 times', async t => {
        assert.strictEqual(task.histogram.count, 10)
      })
    })

    await t.test('returns an Array of entries', async t => {
      let entries

      await t.beforeEach(async t => {
        entries = await task.run()
      })

      await t.test('with 10 elements', async t => {
        assert.strictEqual(entries.length, 10)
      })

      await t.test('each is an Entry', async t => {
        entries.forEach(entry => {
          assert.strictEqual(entry.constructor.name, 'Object')
          assert.ok(Object.hasOwn(entry, 'duration'))
        })
      })
    })

    await t.test('passes an arguments array when calling "fn"', async t => {
      await t.test('has an object as 1st element', async t => {
        mockFn.mock.calls.forEach(call => {
          assert.ok(Array.isArray(call.arguments))
        })

        mockFn.mock.calls.forEach(call => {
          assert.ok(typeof call.arguments[0] === 'object')
        })
      })

      await t.test('has a "cycle" property', async t => {
        mockFn.mock.calls.forEach(call => {
          assert.ok(Object.hasOwn(call.arguments[0], 'cycle'))
        })

        await t.test('of type number', async t => {
          mockFn.mock.calls.forEach(call => {
            assert.ok(typeof call.arguments[0].cycle === 'number')
          })
        })

        await t.test('equals 10', async t => {
          mockFn.mock.calls.forEach(call => {
            assert.ok(call.arguments[0].cycle === 10)
          })
        })
      })

      await t.test('has a "taskname" property', async t => {
        mockFn.mock.calls.forEach(call => {
          assert.ok(Object.hasOwn(call.arguments[0], 'cycle'))
        })

        await t.test('of type string', async t => {
          mockFn.mock.calls.forEach(call => {
            assert.ok(typeof call.arguments[0].cycle === 'string')
          })
        })

        await t.test('equals "foo"', async t => {
          mockFn.mock.calls.forEach(call => {
            assert.ok(call.arguments[0].taskname === 'foo')
          })
        })
      })
    })
  })
})
