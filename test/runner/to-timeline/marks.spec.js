import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'
import { setTimeout } from 'timers/promises'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner, fooFn, barFn, bazFn

  await t.test('#toTimeline (marks)', async t => {
    await t.test('produces a timeline', async t => {
      let rows = null, marks = null, measures = null

      await beforeEach(async () => {
        fooFn = async () => {
          const foo = performance.mark('foo')
          await setTimeout(5)
          const bar = performance.mark('bar')
          const baz = performance.measure('baz', 'foo', 'bar')
        }

        runner = new PerformanceRunner()

        await runner.run([
          { name: 'foo', cycles: 5, fn: fooFn }
        ])

        rows = runner.toTimeline().table.rows
        marks = rows.filter(row => row.text.type.includes('mark'))
        measures = rows.filter(row => row.text.type.includes('measure'))
      })

      await t.test('produces a timeline', async t => {
        await t.test('table includes 2 marks for each cycle', async t => {
          assert.strictEqual(marks.length, 10)
        })

        await t.test('table includes 1 measure for each cycle', async t => {
          assert.strictEqual(measures.length, 5)
        })

        await t.test('measures durations have the expected value', async t => {
          measures.map(row => row.text.value)
            .map(value => value.replaceAll('ms', '').trim())
            .map(value => value.replace(/\u001b[^m]*?m/g,""))
            .map(value => parseInt(value))
            .forEach(duration => {
              assert.ok(duration > 3 && duration < 100)
            })
        })
      })
    })
  })
})
