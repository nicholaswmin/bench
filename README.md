[![test-workflow][test-workflow-badge]][ci-test] [![Coverage Status][coveralls-badge]][coveralls-report]

# ⏱️️ benchmrk

Benchmarking in [Node.js][nodejs], using the [User Timing API][user-timing]

- [Install](#install)
- [Usage](#usage)
  * [Running tasks](#usage)
  * [Defining a task](#defining-a-task)
  * [Taking measurements](#capturing-measurements)
    + [timings with `performance.timerify`](#using-performancetimerify)
    + [timings with `performance.measure`](#using-performancemeasure)
    + [arbitrary values with `performance.mark`](#measuring-arbitrary-values)
  * [Displaying results](#displaying-results)
    + [`runner.toHistogram()`](#runnertoHistogram)
    + [`runner.toTimeline()`](#runnertotimeline)
    + [`runner.toEntries()`](#runnertoentries)
    + [`runner.toPlots()`](#runnertoplots)
  * [Current cycle info](#current-cycle-info)
- [Testing](#test)
  * [Unit tests](#run-unit-tests)
  * [Test coverage](#print-test-coverage-report)
- [Authors](#authors)
- [License](#license)

## Install

```bash
npm i benchmrk
```

## Usage

#### Example:

Run 2 tasks, each one for 3 times, then log a report describing the
duration of each run:

```js
import Runner from 'benchmrk'

const runner = new Runner()

await runner.run([
  {
    name: 'Task A',
    cycles: 3,
    fn: function() {
      slowFunctionFoo()
      slowFunctionBar()
    }
  },

  {
    name: 'Task B',
    cycles: 3,
    fn: async function() {
      await slowAsyncFunctionBaz()
    }
  }
])

runner.toTimeline()
```

outputs a timeline of the task cycles with the duration in
[milliseconds][millis]:

```text   
┌─────────┬──────┬───────────┐
│    type │ name │ duration  │
├─────────┼──────┼───────────┤
│ Task: A │      │           │
│         │      │           │
│   cycle │  A 1 │ 321.44 ms │
│   cycle │  A 2 │ 250.95 ms │
│   cycle │  A 3 │ 212.20 ms │
│         │      │           │
│ Task: B │      │           │
│         │      │           │
│   cycle │  B 1 │ 255.61 ms │
│   cycle │  B 2 │ 121.10 ms │
│   cycle │  B 3 │ 193.12 ms │
│         │      │           │
└─────────┴──────┴───────────┘
```

or output as a [histogram][hgram]:

```js
// ... rest of code

runner.toHistogram()
```

which outputs:

```text
┌───────────┬───────┬─────────┬─────────┬─────────┬─────────────────────┐
│      name |   min │     max │    mean │    50 % │    99 % │ deviation │
├───────────┼───────┼─────────┼─────────┼─────────┼─────────┼───────────┤
│     tasks │       │         │         │         │         │           │
│           │       │         │         │         │         │           │
│    Task A |  1 ms │  3.2 ms │ 2.13 ms │ 2.01 ms │ 2.10 ms │ 0.29 ms   │
│    Task B │  2 ms │  3.1 ms │ 2.66 ms │ 2.44 ms │ 2.60 ms │ 0.07 ms   │
│           │       │         │         │         │         │           │
│     entry │       │         │         │         │         │           │
│           │       │         │         │         │         │           │
│ mem-usage │       │ 11.2 mb │ 36.3 mb │ 22.1 mb │ 21.2 mb │ 19.2 mb   │
└───────────┴───────┴─────────┴─────────┴─────────┴─────────┴───────────┘
```

### Defining a task

`runner.run(tasks)` accepts an array of *tasks*.

Each task is an object with the following properties:

| property  | type      	| description                     | required 	|
|---------	|------------	|--------------------------------	|----------	|
| `name`  	| `String`   	| the task name                  	| yes     	|
| `cycle` 	| `Number`   	| how many times to run the task 	| yes     	|
| `fn`    	| `Function` 	| the task function              	| yes      	|

##### Example:

```js
// A task

{
  name: 'Task A',
  cycles: 10,
  fn: function() {
    // will run 10 times
  }
}
```

## Capturing measurements

The durations of each task cycle are captured and displayed automatically.

You might also need to capture the durations of *specific* functions/steps
within each task, so you can figure out where most of the time is spent.

For these use-cases, you can use these [Performance Measurement][perf-hooks]
methods:

- [`performance.timerify`][timerify]
- [`performance.measure`][measure]
- [`performance.mark`][mark]

### Using `performance.timerify`

[`performance.timerify`][timerify] wraps a function within a new
function that measures the running time of the wrapped function.

#### Example

Tracking the duration of `fetch` and `save` functions:

> assume `fetch`/`save` are real functions to get/save a user from/to
> a database

```js
// function A:
const fetch = () => new Promise(res => setTimeout(res, 50))
// function B:
const save = () => new Promise(res => setTimeout(res, 50))

// timerify "function A":
const fetchTimerified = performance.timerify(fetch)
// timerify "function B":
const saveTimerified = performance.timerify(save)

await runner.run([
  {
    name: 'A',
    cycles: 3,
    fn: async () => {
      // use timerified function:
      const user = await fetchTimerified('foo')

      user.updateName('bar')

      // use timerified function:
      await saveTimerified(user)
    }
  },

  {
    name: 'B',
    cycles: 2,
    fn: async () => {
      const user = new User('bar')

      user.updateName('baz')

      // use timerified function:
      await saveTimerified(user)
    }
  }
])

runner.toTimeline()
```

which outputs:

```bash
┌──────────┬───────┬───────────┐
│     type │  name │ value     │
├──────────┼───────┼───────────┤
│  Task: A │       │           │
│          │       │           │
│    cycle │   A 1 │  36.36 ms │
│ function │ fetch │  31.12 ms │
│ function │  save │   5.24 ms │
│          │       │           │
│    cycle │   A 2 │ 189.12 ms │
│ function │ fetch │  80.03 ms │
│ function │  save │ 109.09 ms │
│          │       │           │
│  Task: B │       │           │
│          │       │           │
│    cycle │   B 1 │ 111.70 ms │
│ function │  save │  40.43 ms │
│          │       │           │
│    cycle │   B 2 │ 225.74 ms │
│ function │  save │   8.18 ms │
│          │       │           │
│    cycle │   B 3 │  98.79 ms │
│ function │  save │   8.18 ms │
└──────────┴───────┴───────────┘
```

### Using `performance.measure`

Use [`performance.measure`][measure] to capture a time measurement
between two marks, set via [`performance.mark`][mark].

#### Example

Measure the duration between mark `a` and mark `b`:

```js
const runner = new Bench()

await runner.run([
  {
    name: 'A',
    cycles: 3,
    fn: async ({ cycle, taskname }) => {
      const user = new User()

      // start mark
      performance.mark('a')

      await user.greet()
      await save(user)

      // end mark
      performance.mark('b')

      // measure duration between `a`-`b`
      performance.measure('a-b', 'a', 'b')
    }
  },

  {
    name: 'B',
    cycles: 2,
    fn: async ({ cycle, taskname }) => {
      const user = new User()

      await save(user)
    }
  }
])

runner.toTimeline()
```

which outputs:

```text
┌──────────┬───────┬───────────┐
│     type │  name │ duration  │
├──────────┼───────┼───────────┤
│  Task: A │       │           │
│          │       │           │
│    cycle │   A 1 │ 141.71 ms │
|  measure │   a-b │ 120.20 ms │
|          |       |           |
│    cycle │   A 2 │ 125.74 ms │
|  measure │   a-b │  89.18 ms │
│          │       │           │
│    cycle │   A 3 │  98.79 ms │
|  measure │   a-b │  44.35 ms │
│          │       │           │
|  Task: B |       |           |
|          |       |           |
│    cycle │   B 1 │ 100.64 ms │
│    cycle │   B 2 │  90.12 ms │
│    cycle │   B 3 │  76.88 ms │
│          │       │           │
└──────────┴───────┴───────────┘
```

There's additional ways of using `performance.measure` which can be found
in the [`Performance:Measure` docs][measure].

### Measuring arbitrary values

Measure arbitrary values using [`performance.mark`][mark] and passing an
`object` with these properties in the `detail` parameter:

| property  | type      	| description      | required 	|
|---------	|------------	|----------------- |----------- |
| `value`   | `Number`   	| tracked value    | yes 	      |
| `unit`    | `String`  	| label for value  | yes 	      |


##### Example

Capturing memory usage at the end of each cycle,
then displaying the cumulative `min`/`mean`/`max` values:

```js
await runner.run([
  {
    name: 'A',
    cycles: 5,
    fn: async () => {
      const user = new User('foo')

      await save(user)

      performance.mark('mem-usage', {
        detail: {
          value: process.memoryUsage().heapUsed / 1000 / 1000,
          unit: 'mb'
        }
      })
    }
  },

  {
    name: 'B',
    cycles: 10,
    fn: async () => {
      const user = new User('bar')

      await save(user)

      performance.mark('mem-usage', {
        detail: {
          value: process.memoryUsage().heapUsed / 1000 / 1000,
          unit: 'mb'
        }
      })
    }
  }
])

runner.toHistogram()
```

which outputs:

```text
┌───────────┬───────┬─────────┬─────────┬─────────┬─────────────────────┐
│      name |   min │     max │    mean │    50 % │    99 % │ deviation │
├───────────┼───────┼─────────┼─────────┼─────────┼─────────┼───────────┤
│     tasks │       │         │         │         │         │           │
│           │       │         │         │         │         │           │
│    Task A |  1 ms │  3.2 ms │ 2.13 ms │ 2.01 ms │ 2.10 ms │ 0.29 ms   │
│    Task B │  2 ms │  3.1 ms │ 2.66 ms │ 2.44 ms │ 2.60 ms │ 0.07 ms   │
│           │       │         │         │         │         │           │
│     entry │       │         │         │         │         │           │
│           │       │         │         │         │         │           │
│ mem-usage │ 11 mb | 51.2 mb │ 36.3 mb │ 22.1 mb │ 21.2 mb │ 19.2 mb   │
└───────────┴───────┴─────────┴─────────┴─────────┴─────────┴───────────┘
```

### Displaying results

There are different ways of visualising measurements.

- A timeline
- A [histogram][hgram]
- An ASCII chart of max-durations

##### Example

Displaying the output as a timeline:

```js
const runner = new Bench()

await runner.run(tasks)

runner.toTimeline()

// or:

// runner.toHistogram()
// runner.toEntries()
// runner.toPlots()
```

#### `runner.toTimeline()`

Displays a detailed breakdown of each cycle,
for each task as a timeline:

```text
┌──────────┬───────┬───────────┐
│     type │  name │ value     │
├──────────┼───────┼───────────┤
│  Task: A │       │           │
│          │       │           │
│    cycle │   A 1 │ 36.36 ms  │
│ function │  save │ 36.12 ms  │
│          │       │           │
│    cycle │   A 2 │ 189.33 ms │
│ function │  save │ 189.09 ms │
│          │       │           │
│  Task: B │       │           │
│          │       │           │
│    cycle │   B 1 │ 121.03 ms │
│ function │  save │  40.43 ms │
│ function │ greet │  80.60 ms │
│          │       │           │
│    cycle │   B 2 │ 235.08 ms │
│ function │  save │ 145.08 ms │
│ function │ greet │  90.00 ms │
│          │       │           │
│    cycle │   B 3 │ 165.00 ms │
│ function │  save │ 100.00 ms │
│ function │ greet │  61.00 ms │
│          │       │           │
└──────────┴───────┴───────────┘
```

#### `runner.toHistogram()`

Produces a [histogram][hgram] with `min`/`mean`/`max` and `percentiles` for
each measurement.

```text
┌──────────────┬───────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────┐
│         name │ count │     min │     max │    mean │    50 % │    99 % │ dev │
├──────────────┼───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│        tasks │       │         │         │         │         │         │     │
│              │       │         │         │         │         │         │     │
│       Task A │     5 │ 0.04 ms │ 0.29 ms │ 0.17 ms │ 0.04 ms │ 0.29 ms │ 0   |
│       Task B │    10 │ 0.05 ms │ 0.07 ms │ 0.06 ms │ 0.05 ms │ 0.07 ms │ 0   │
│              │       │         │         │         │         │         │     │
│        entry │       │         │         │         │         │         │     │
│              │       │         │         │         │         │         │     │
│ memory-usage │    15 │ 11.2 mb │ 36.3 mb │ 22.1 mb │ 21.2 mb │   19 mb │ 12  │
└──────────────┴───────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┘
```

#### `runner.toEntries()`

Returns an array of all recorded [`PerformanceEntry`][perf-entry]
entries of each task, as [JSONs][perf-entry-json].


```js
console.log(runner.toEntries())

[
  {
    name: 'Task A',
    entries: [
      {
        name: 'fetch',
        entryType: 'function',
        startTime: 112.391,
        duration: 0.00533300000000736,
      },

      {
        name: 'save',
        entryType: 'function',
        startTime: 129.125,
        duration: 0.00851780000000122,
      },

      // more "Task A" entries ...
    ]
  },

  {
    name: 'Task B',
    entries: [
      {
        name: 'save',
        entryType: 'function',
        startTime: 160.221,
        duration: 0.00237910000000368,
      },
      {
        name: 'foo',
        entryType: 'mark',
        startTime: 201.539,
        duration: 0
      },

      // more "Task B" entries ...
    ]
  }
]
```

#### `runner.toPlots()`

Draws an ASCII chart of max durations for each task.

The chart displays the duration of each cycle and any
[timerified functions][timerify]:

```text
                                Task: "B"
durations (ms)                                   - main task - fn:save

457.00 ┤                                                            
416.80 ┤                                             
376.60 ┼───────────────╮                                                      
336.40 ┤               │                                                        
296.20 ┤               ╰───────────────╮                                              
256.00 ┤                               |                                               
215.80 ┤                               |                               
175.60 ┤                               |            
135.40 ┤               ╭─────────────────────────────────────────────╮                
95.20  ┤               │               |                             │                
55.00  ┼───────────────╯               |                             |
 ───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬
    0   1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  17  18     
                                                                   cycles
```

### Current cycle info

The `fn` function is passed the following parameters:

| name  	   | type      	  | description       |
|----------- |------------	|------------------ |
| `cycle`    | `Number`   	| The current cycle |
| `taskname` | `String`  	  | The task name     |

which gives you access to the current cycle:

```js
const runner = new Bench()

await runner.run([
  {
    name: 'A',
    cycles: 3,
    fn: async ({ cycle, taskname }) => {
      console.log(cycle)

      // '1' for 1st cycle
      // '2' for 2nd cycle
      // '3' for 3rd/last cycle

      console.log(taskname)

      // 'A'
    }
  },

  // entries ...
])
```

## Test

### Install deps

```bash
npm ci
```

### Run unit tests

```bash
npm test
```

### Generate test-coverage

```bash
npm run lcov
```

## Authors

[@nicholaswmin][nicholaswmin]

## License

>
> MIT "No attribution" License
>
> Copyright 2024  
> Nicholas Kyriakides
>
> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the "Software"),
> to deal in the Software without restriction, including without limitation the
> rights to use, copy, modify, merge, publish, distribute, sublicense,
> and/or sell copies of the Software, and to permit persons to whom the
> Software is furnished to do so.


[test-workflow-badge]: https://github.com/nicholaswmin/bench/actions/workflows/tests.yml/badge.svg
[ci-test]: https://github.com/nicholaswmin/bench/actions/workflows/tests.yml

[coveralls-badge]: https://coveralls.io/repos/github/nicholaswmin/bench/badge.svg?branch=main
[coveralls-report]: https://coveralls.io/github/nicholaswmin/bench?branch=main

[perf-hooks]: https://nodejs.org/api/perf_hooks.html
[user-timing]: https://www.w3.org/TR/user-timing-2/
[nodejs]: https://nodejs.org/en
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#performancemeasurename-startmarkoroptions-endmark
[mark]: https://nodejs.org/api/perf_hooks.html#performancemarkname-options
[hgram]: https://en.wikipedia.org/wiki/Histogram
[perf-entry]: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry
[perf-entry-json]: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEntry/toJSON
[nicholaswmin]: https://github.com/nicholaswmin
[mit-no-attr]: https://github.com/aws/mit-0
[millis]: https://en.wikipedia.org/wiki/Millisecond
