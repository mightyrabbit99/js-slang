import createContext from './createContext'
import { manualToggleDebugger, resetDebugger, resumeDebugger } from './debugger'
import { evaluate } from './interpreter'
import { InterruptedError } from './interpreter-errors'
import { parse } from './parser'
import { AsyncScheduler, PreemptiveScheduler } from './schedulers'
import { Context, Error, Finished, Result, Scheduler, SourceError } from './types'

export interface IOptions {
  scheduler: 'preemptive' | 'async'
  steps: number
  debugger: boolean
}

export const DEFAULT_OPTIONS: IOptions = {
  scheduler: 'async',
  steps: 1000,
  debugger: true
}

export function parseError(errors: SourceError[]): string {
  const errorMessagesArr = errors.map(error => {
    const line = error.location ? error.location.start.line : '<unknown>'
    const explanation = error.explain()
    return `Line ${line}: ${explanation}`
  })
  return errorMessagesArr.join('\n')
}

export function runInContext(
  code: string,
  context: Context,
  options: Partial<IOptions> = {}
): Promise<Result> {
  const theOptions: IOptions = { ...DEFAULT_OPTIONS, ...options }
  context.errors = []
  const program = parse(code, context)
  if (program) {
    const it = evaluate(program, context)
    let scheduler: Scheduler
    if (theOptions.scheduler === 'async') {
      scheduler = new AsyncScheduler()
    } else {
      scheduler = new PreemptiveScheduler(theOptions.steps)
    }
    const promise = scheduler.run(it, context, options.debugger)
    if (context.debugger.toggled) {
      resumeDebugger(context)
    }
    return promise
  } else {
    return Promise.resolve({ status: 'error' } as Result)
  }
}

export function resume(result: Result): Finished | Error | Promise<Result> {
  if (result.status === 'finished' || result.status === 'error') {
    return result
  } else {
    if (result.context.debugger.toggled) {
      resetDebugger(result.context)
      return result.scheduler.run(result.it, result.context, true)
    } else {
      resetDebugger(result.context)
      return { status: 'error' }
    }
  }
}

export function interrupt(context: Context) {
  const globalFrame = context.runtime.frames[context.runtime.frames.length - 1]
  context.runtime.frames = [globalFrame]
  context.runtime.isRunning = false
  context.errors.push(new InterruptedError(context.runtime.nodes[0]))
}

export { createContext, Context, Result, manualToggleDebugger, resetDebugger }
