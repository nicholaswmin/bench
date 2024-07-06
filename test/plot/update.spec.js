import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'
import { setTimeout } from 'timers/promises'

import CyclePlot from '../../src/cycle-plot/index.js'

test('CyclePlot', async t => {
  let i, plot, entries

  await t.test('#update', async t => {
    await beforeEach(async t => {
      i = 0
      entries = []
      plot = new CyclePlot({ name: 'Foo', entries })

      await plot.update(i++)
    })

    await t.test('without entries', async t => {
      await t.test('no cycles are set', async t => {
        assert.deepStrictEqual(plot.cycles, {})
      })
    })

    await t.test('has entries', async t => {
      await beforeEach(async t => {
        entries = [
          {
            name: 'gc',  startTime: 1, duration: 5, entryType: 'gc', detail: []
          },

          {
            name: 'fn',
            startTime: 2, duration: 2, entryType: 'function',
            detail: [{ cycle: 3, taskname: 'foo' }]
          },

          {
            name: 'foo',
            startTime: 3, duration: 3, entryType: 'function', detail: []
          },

          {
            name: 'foo',
            startTime: 4, duration: 4, entryType: 'function', detail: []
          }
        ]

        plot = new CyclePlot({ name: 'Foo', entries })

        await plot.update(i++)
      })

      await t.test('function entries added as cycle', async t => {
        assert.ok(Object.hasOwn(plot.cycles, 'foo'))

        await t.test('cycle is an array', async t => {
          assert.ok(Array.isArray(plot.cycles.foo))
        })
      })

      await t.test('non-function entries are ignored', async t => {
        assert.ok(!Object.hasOwn(plot.cycles, 'gc'))
      })

      await t.test('only one cycle is added per function name', async t => {
        assert.strictEqual(Object.keys(plot.cycles).length, 1)
      })

      await t.test('only one entry is added to cycle', async t => {
        assert.strictEqual(plot.cycles.foo.length, 1)

        await t.test('and that entry is always the last entry', async t => {
          assert.strictEqual(plot.cycles.foo.at(-1).duration, 4)
        })
      })

      await t.test('"fn" use detail.0.taskname for name', async t => {
        assert.ok(Object.keys(plot.cycles).includes('foo'))
      })

      await t.test("entries are grouped by name", async t => {
        assert.ok(Array.isArray(plot.cycles.foo))
        assert.strictEqual(plot.cycles.foo.length, 1)
      })

      await t.test('next update()', async t => {
        await t.test('with new distinctly named entry', async t => {
          await beforeEach(async t => {
            plot.entries.push(...[
              {
                name: 'fn',
                startTime: 6, duration: 6, entryType: 'function', detail: [{
                  taskname: 'bar',
                  cycle: 0
                }]
              },

              {
                name: 'bar',
                startTime: 7, duration: 7, entryType: 'function', detail: []
              }
            ])

            await plot.update(i++)
          })

          await t.test('previous cycles are preserved', async t => {
            assert.ok(Object.hasOwn(plot.cycles, 'foo'))
          })

          await t.test('function entry added as cycle', async t => {
            assert.ok(Object.hasOwn(plot.cycles, 'bar'))

            await t.test('cycle is an array', async t => {
              assert.ok(Array.isArray(plot.cycles.bar))
            })

            await t.test('cycle is left-padded to match length', async t => {
              assert.strictEqual(plot.cycles.bar.length, 2)

              await t.test('1st entry is padding entry', async t => {
                assert.strictEqual(plot.cycles.bar[0].duration, 0)
              })

              await t.test('2nd entry is actual entry', async t => {
                assert.strictEqual(plot.cycles.bar[1].name, 'bar')
                assert.strictEqual(plot.cycles.bar[1].duration, 7)
              })
            })
          })
        })

        await t.test('no new entries for currently set cycles', async t => {
          await beforeEach(async t => {
            await plot.update(i++)
            await plot.update(i++)
          })

          await t.test('adds padding entries', t => {
            assert.strictEqual(plot.cycles.foo.length, 3)
          })

          await t.test('cycle is right padded with pad entries', async t => {
            const lastTwoFooEntries = plot.cycles.foo.slice(
              plot.cycles.foo.length - 2,
              plot.cycles.foo.length
            )

            assert.strictEqual(lastTwoFooEntries.length, 2)

            await t.test('pad entries repeat last entry start time', t => {
              lastTwoFooEntries.forEach(entry => {
                assert.strictEqual(entry.startTime, 4)
              })
            })

            await t.test('padding entries have 0 duration', t => {
              lastTwoFooEntries.forEach(entry => {
                assert.strictEqual(entry.duration, 0)
              })
            })
          })
        })
      })
    })
  })
})
