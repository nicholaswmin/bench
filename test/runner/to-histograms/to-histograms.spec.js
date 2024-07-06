import assert from 'node:assert'
import { setTimeout } from 'timers/promises'
import { mock, test, before, beforeEach } from 'node:test'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner = null, result = null, rows = null, foo = null, bar = null

  await t.test('#toHistograms', async t => {
    await t.test('rejects if called before a run', async t => {
      await assert.rejects(async () => {
        await runner.toHistograms()
      })
    })

    await t.test('produces a histogram', async t => {
      await beforeEach(async () => {
        const fn = async () => {
          await setTimeout(5)
        }

        runner = new PerformanceRunner()

        await runner.run([
          { name: 'foo', cycles: 4, fn: fn },
          { name: 'bar', cycles: 3, fn: fn }
        ])

        result = await runner.toHistograms()

        foo = result.table.rows.find(row => row.text.name.includes('foo'))
        bar = result.table.rows.find(row => row.text.name.includes('bar'))
      })

      await t.test('includes 1 bar entry', async t => {
        assert.ok(bar)

        await t.test('with a text property', async t => {
          assert.ok(Object.hasOwn(bar, 'text'))
        })

        await t.test('with a text.count property', async t => {
          assert.ok(Object.hasOwn(bar.text, 'count'))
        })

        await t.test('with count equaling the cycles', async t => {
          const num = parseInt(bar.text.count)
          assert.strictEqual(num, 3)
        })
      })

      await t.test('includes 1 foo entry', async t => {
        assert.ok(foo)

        await t.test('with a text property', async t => {
          assert.ok(Object.hasOwn(foo, 'text'))
        })

        await t.test('with a text.count property', async t => {
          assert.ok(Object.hasOwn(foo.text, 'count'))
        })

        await t.test('with count equaling the cycles', async t => {
          const num = parseInt(foo.text.count)
          assert.strictEqual(num, 4)
        })

        await t.test('with min duration', async t => {
          assert.ok(foo.text.min)

          await t.test('in ms', async t => {
            assert.ok(foo.text.min.includes('ms'))
          })

          await t.test('around the expected duration', async t => {
            const sanitised = foo.text['min'].replace(/\u001b[^m]*?m/g,"")
            const num = parseInt(sanitised.replace(' ms', ''))
            assert.ok(num > 3 & num < 200)
          })
        })

        await t.test('with max duration', async t => {
          assert.ok(foo.text.max)

          await t.test('in ms', async t => {
            assert.ok(foo.text.max.includes('ms'))
          })

          await t.test('around the expected duration', async t => {
            const sanitised = foo.text['max'].replace(/\u001b[^m]*?m/g,"")
            const num = parseInt(sanitised.replace(' ms', ''))
            assert.ok(num > 3 & num < 200)
          })
        })

        await t.test('with mean duration', async t => {
          assert.ok(foo.text.mean)

          await t.test('in ms', async t => {
            assert.ok(foo.text.mean.includes('ms'))
          })

          await t.test('around the expected duration', async t => {
            const sanitised = foo.text['mean'].replace(/\u001b[^m]*?m/g,"")
            const num = parseInt(sanitised.replace(' ms', ''))
            assert.ok(num > 3 & num < 200)
          })
        })

        await t.test('with 50% duration', async t => {
          assert.ok(foo.text['50_%'])


          await t.test('in ms', async t => {
            assert.ok(foo.text['50_%'].includes('ms'))
          })

          await t.test('around the expected duration', async t => {
            const sanitised = foo.text['50_%'].replace(/\u001b[^m]*?m/g,"")
            const num = parseInt(sanitised.replace(' ms', ''))
            assert.ok(num > 3 & num < 200)
          })
        })

        await t.test('with 75_% duration', async t => {
          assert.ok(foo.text['75_%'])

          await t.test('in ms', async t => {
            assert.ok(foo.text['75_%'].includes('ms'))
          })

          await t.test('around the expected duration', async t => {
            const sanitised = foo.text['75_%'].replace(/\u001b[^m]*?m/g,"")
            const num = parseInt(sanitised.replace(' ms', ''))
            assert.ok(num > 3 & num < 200)
          })
        })

        await t.test('with 100_% duration', async t => {
          assert.ok(foo.text['100_%'])

          await t.test('in ms', async t => {
            assert.ok(foo.text['100_%'].includes('ms'))
          })

          await t.test('around the expected duration', async t => {
            const sanitised = foo.text['100_%'].replace(/\u001b[^m]*?m/g,"")
            const num = parseInt(sanitised.replace(' ms', ''))
            assert.ok(num > 3 & num < 200)
          })
        })
      })

      assert.ok(result)
    })
  })
})
