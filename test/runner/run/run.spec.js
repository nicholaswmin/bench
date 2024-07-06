import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner, fooFn, barFn, bazFn

  await t.test('#run', async t => {
    await beforeEach(async () => {
      fooFn = mock.fn()
      barFn = mock.fn()
      bazFn = mock.fn()

      runner = new PerformanceRunner()

      await runner.run([
        { name: 'foo', cycles: 2, fn: fooFn },
        { name: 'bar', cycles: 3, fn: barFn },
        { name: 'baz', cycles: 1, fn: bazFn }
      ])
    })

    await t.test('when passed 3 tasks', async t => {
      await t.test('function with 2 cycles', async t => {
        await t.test('is called twice', async t => {
          assert.strictEqual(fooFn.mock.callCount(), 2)
        })
      })

      await t.test('function with 3 cycles', async t => {
        await t.test('is called thrice', async t => {
          assert.strictEqual(barFn.mock.callCount(), 3)
        })
      })

      await t.test('function with 1 cycle', async t => {
        await t.test('is called once', async t => {
          assert.strictEqual(bazFn.mock.callCount(), 1)
        })
      })
    })

    await t.test('parameter check', async t => {
      await t.test('"task" parameter', async t => {
        await t.test('rejects if its missing', async t => {
          await assert.rejects(async () => {
            await runner.run()
          })
        })

        await t.test('rejects if it does not have length', async t => {
          await assert.rejects(async () => {
            await runner.run([])
          })
        })

        await t.test('rejects if its items arent objects', async t => {
          await assert.rejects(async () => {
            await runner.run([
              { name: 'foo', cycles: 3, fn: () => {} },
              `{ name: 'bar', cycles: 1, fn: () => {} }`
            ])
          })
        })

        await t.test('rejects if items do not have valid name', async t => {
          await assert.rejects(async () => {
            await runner.run([
              { name: '', cycles: 3, fn: () => {} }
            ])
          })
        })

        await t.test('rejects if items do not have valid fn', async t => {
          await assert.rejects(async () => {
            await runner.run([
              { name: 'foo', cycles: 3, fn: null }
            ])
          })
        })

        await t.test('rejects if items do not have valid cycles', async t => {
          await t.test('as a non positive number', async t => {
            await assert.rejects(async () => {
              await runner.run([
                { name: 'foo', cycles: 0, fn: () => {} }
              ])
            })
          })
        })
      })
    })

    await t.test('rejects if run called twice in a row', async t => {
      await assert.rejects(async () => {
        await runner.run()
        await runner.run()
      })
    })

    await t.test('rejects if run called after end', async t => {
      await assert.rejects(async () => {
        await runner.run()
        await runner.toHistograms()
        await runner.run()
      })
    })
  })
})
