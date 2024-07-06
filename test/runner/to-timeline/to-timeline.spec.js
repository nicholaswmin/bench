import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'
import { setTimeout } from 'timers/promises'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner, fooFn, barFn, bazFn

  await t.test('#toTimeline', async t => {
    await t.test('rejects if "toTimeline" called before a run', async t => {
      await assert.rejects(async () => {
        await runner.toTimeline()
      })
    })

    await t.test('produces a timeline', async t => {
      let result = null, rows = null

      await beforeEach(async () => {
        fooFn = async () => {
          await setTimeout(5)
        }
        barFn = mock.fn()
        bazFn = mock.fn()

        runner = new PerformanceRunner()

        await runner.run([
          { name: 'foo', cycles: 2, fn: fooFn }
        ])
      })

      await t.test('produces a timeline', async t => {
        await t.test('produces a timeline', async t => {
          result = await runner.toTimeline()
          rows = result.table.rows
        })

        await t.test('produces a timeline table', async t => {
          assert.ok(result.table)
        })

        await t.test('has a title', async t => {
          assert.ok(result.table.title)
        })

        await t.test('has 2 rows for the 2 cycles of foo function', async t => {
          let foos

          await beforeEach(() => {
            foos = rows.filter(row => row.text.name?.includes('foo'))
          })

          await t.test('has 1 row for each of 2 cycles of foo', async t => {
            assert.strictEqual(foos.length, 2)
          })

          await t.test('each row includes the task name', async t => {
            foos.forEach(foo => foo.text.name.includes('foo'))
          })

          await t.test('', async t => {
            let withMS, parsedNums

            beforeEach(() => {
              withMS = runner.toTimeline().table.rows
                .filter(row => row.text.name?.includes('foo'))
                .filter(row => row.text.value?.includes('ms'))
                .map(row => row.text.value)

              parsedNums = withMS
                .map(value => value.replaceAll('ms', '').trim())
                .map(value => value.replace(/\u001b[^m]*?m/g,""))
                .map(value => parseInt(value))
            })

            await t.test('includes ms postfix', async t => {
              assert.strictEqual(withMS.length, 2)
            })

            await t.test('are around the expected func duration', async t => {
              assert.strictEqual(parsedNums.length, 2)
              parsedNums.forEach(num => assert.ok(num > 3 && num < 100))
            })
          })
        })
      })
    })
  })
})
