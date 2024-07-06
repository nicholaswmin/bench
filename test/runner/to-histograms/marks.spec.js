import assert from 'node:assert'
import { setTimeout } from 'timers/promises'
import { mock, test, before, beforeEach } from 'node:test'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner = null, result = null, rows = null

  await t.test('#toHistograms', async t => {
    let result = null, foo = null, bar = null, baz = null

    await beforeEach(async () => {
      const fn = async () => {
        const foo = performance.mark('foo')
        await setTimeout(5)
        const bar = performance.mark('bar')
        const baz = performance.measure('baz', 'foo', 'bar')
      }

      runner = new PerformanceRunner()

      await runner.run([
        { name: 'baz', cycles: 3, fn: fn }
      ])

      result = await runner.toHistograms()

      foo = result.table.rows.find(row => row.text.name.includes('foo'))
      bar = result.table.rows.find(row => row.text.name.includes('bar'))
      baz = result.table.rows.find(row => row.text.name.includes('baz'))
    })

    await t.test('produces a histogram', async t => {
      assert.ok(result)
    })

    await t.test('includes 1 baz measure', async t => {
      assert.ok(baz)
    })

    await t.test('does not include the entries of this measure', async t => {
      assert.ok(!foo)
      assert.ok(!bar)
    })

    await t.test('with a text.count property', async t => {
      assert.ok(Object.hasOwn(baz.text, 'count'))
    })

    await t.test('with count equaling the cycles', async t => {
      const num = parseInt(baz.text.count)
      assert.strictEqual(num, 3)
    })

    await t.test('with min duration', async t => {
      assert.ok(baz.text.min)

      await t.test('in ms', async t => {
        assert.ok(baz.text.min.includes('ms'))
      })

      await t.test('around the expected duration', async t => {
        const sanitised = baz.text['min'].replace(/\u001b[^m]*?m/g,"")
        const num = parseInt(sanitised.replace(' ms', ''))
        assert.ok(num > 3 & num < 100)
      })
    })

    await t.test('with max duration', async t => {
      assert.ok(baz.text.max)

      await t.test('in ms', async t => {
        assert.ok(baz.text.max.includes('ms'))
      })

      await t.test('around the expected duration', async t => {
        const sanitised = baz.text['max'].replace(/\u001b[^m]*?m/g,"")
        const num = parseInt(sanitised.replace(' ms', ''))
        assert.ok(num > 3 & num < 100)
      })
    })

    await t.test('with mean duration', async t => {
      assert.ok(baz.text.mean)

      await t.test('in ms', async t => {
        assert.ok(baz.text.mean.includes('ms'))
      })

      await t.test('around the expected duration', async t => {
        const sanitised = baz.text['mean'].replace(/\u001b[^m]*?m/g,"")
        const num = parseInt(sanitised.replace(' ms', ''))
        assert.ok(num > 3 & num < 100)
      })
    })

      await t.test('with 50% duration', async t => {
        assert.ok(baz.text['50_%'])


      await t.test('in ms', async t => {
        assert.ok(baz.text['50_%'].includes('ms'))
      })

      await t.test('around the expected duration', async t => {
        const sanitised = baz.text['50_%'].replace(/\u001b[^m]*?m/g,"")
        const num = parseInt(sanitised.replace(' ms', ''))
        assert.ok(num > 3 & num < 100)
      })
    })

    await t.test('with 75_% duration', async t => {
      assert.ok(baz.text['75_%'])

      await t.test('in ms', async t => {
        assert.ok(baz.text['75_%'].includes('ms'))
      })

      await t.test('around the expected duration', async t => {
        const sanitised = baz.text['75_%'].replace(/\u001b[^m]*?m/g,"")
        const num = parseInt(sanitised.replace(' ms', ''))
        assert.ok(num > 3 & num < 100)
      })
    })

    await t.test('with 100_% duration', async t => {
      assert.ok(baz.text['100_%'])

      await t.test('in ms', async t => {
        assert.ok(baz.text['100_%'].includes('ms'))
      })

      await t.test('around the expected duration', async t => {
        const sanitised = baz.text['100_%'].replace(/\u001b[^m]*?m/g,"")
        const num = parseInt(sanitised.replace(' ms', ''))
        assert.ok(num > 3 & num < 100)
      })
    })
  })
})
