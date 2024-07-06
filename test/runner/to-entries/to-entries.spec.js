import assert from 'node:assert'
import { setTimeout } from 'timers/promises'
import { mock, test, before, beforeEach } from 'node:test'

import { PerformanceRunner } from '../../../index.js'

test('PerformanceRunner', async t => {
  let runner = null, tasks = [], taskEntries = []

  await t.test('#toEntries', async t => {
    await t.test('when run before runner.run() has ended', async t => {
      await beforeEach(async () => {
        runner = new PerformanceRunner()
      })

      await t.test('when run before runner.run() has ended', async t => {
        await t.test('throws an error', async t => {
          assert.throws(t => runner.toEntries())
        })
      })
    })

    await t.test('when run after runner.run() has ended', async t => {
      await beforeEach(async t => {
        runner = new PerformanceRunner()

        tasks = [
          {
            name: 'foo', cycles: 30, fn: () => {
              performance.mark('foo', { detail: { value: 'foo', unit: 'foo' }})
            }
          },
          {
            name: 'foo', cycles: 5, fn: () => {
              performance.mark('bar', { detail: { value: 'bar', unit: 'bar' }})
            }
          }
        ]

        await runner.run(tasks)

        taskEntries = runner.toEntries()
      })

      await t.test("returns each task's PerformanceEntry entries", async t => {
        await t.test('returns an Array', async t => {
          assert.ok(Array.isArray(taskEntries))
        })

        await t.test('with same items as number of passed tasks', async t => {
          assert.strictEqual(taskEntries.length, tasks.length)
        })

        await t.test('each item has a "name" property', async t => {
          taskEntries.forEach(item => {
            assert.ok(Object.hasOwn(item, 'name'))
          })

          await t.test('"item.name" is a String', async t => {
            taskEntries.forEach(item => {
              assert.ok(typeof item.name === 'string')
            })
          })

          await t.test('"item.name" matches a task name', async t => {
            assert.strictEqual(taskEntries[0].name, tasks[0].name)
            assert.strictEqual(taskEntries[1].name, tasks[1].name)
          })
        })

        await t.test('each item has an "entries" property', async t => {
          taskEntries.forEach(item => {
            assert.ok(Object.hasOwn(item, 'entries'))
          })

          await t.test('"item.entries" is an Array', async t => {
            await t.test('"foo" item has at least 20 entries', async t => {
              assert.ok(taskEntries[0].entries.length >= 30)
            })

            await t.test('"bar" item has at least 4 entries', async t => {
              assert.ok(taskEntries[1].entries.length >= 5)
            })

            await t.test('each entry is a PerformanceEntry JSON', async t => {
              taskEntries.forEach(task => {
                task.entries.forEach(entry => {
                  assert.ok(Object.hasOwn(entry, 'name'))
                  assert.ok(Object.hasOwn(entry, 'entryType'))
                  assert.ok(Object.hasOwn(entry, 'startTime'))
                  assert.ok(Object.hasOwn(entry, 'duration'))
                })
              })
            })

            await t.test('"foo" entries includes 30 "foo" marks', async t => {
              const foos = taskEntries[0].entries.filter(e => e.name === 'foo')

              assert.strictEqual(foos.length, 30)

              await t.test('"foo" entries has only "foo" marks', async t => {
                const bars = taskEntries[0].entries.filter(e => e.name == 'bar')

                assert.strictEqual(bars.length, 0)
              })
            })

            await t.test('"bar" entries includes 5 "bar" marks', async t => {
              const bars = taskEntries[1].entries.filter(e => e.name === 'bar')

              assert.strictEqual(bars.length, 5)

              await t.test('"bar" entries includes "bar" marks', async t => {
                const foos = taskEntries[1].entries
                  .filter(e => e.name === 'foo')

                assert.strictEqual(foos.length, 0)
              })
            })
          })
        })
      })
    })
  })
})
