import { styleText as style } from 'node:util'

class RunNotEndedError extends Error {
  constructor() {
    super(style('red', 'Run has not ended yet'))
  }
}

class StillRunningError extends Error {
  constructor() {
    super(style('red', 'Run is still running'))
  }
}

class AlreadyEndedError extends Error {
  constructor(message) {
    super(style('red', 'Run has already ended'))
  }
}

class InvalidStateError extends Error {
  constructor(state) {
    const message = `state must be "running" or "ended", got: "${state || ''}"`
    super(style('red', message))
  }
}

export default {
  RunNotEndedError,
  StillRunningError,
  AlreadyEndedError,
  InvalidStateError
}
