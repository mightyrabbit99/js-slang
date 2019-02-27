/* tslint:disable:max-classes-per-file */
import { MaximumStackLimitExceeded } from './interpreter-errors'
import { Context, Result, Scheduler, Value } from './types'
import { storeCurrentStatus, dummyItValue} from './debugger'

export class AsyncScheduler implements Scheduler {
  public constructor() {
    this.run = this.run.bind(this)
  }

  public run(it: IterableIterator<Value>, context: Context, debug: boolean): Promise<Result> {
    return new Promise((resolve, reject) => {
      context.runtime.isRunning = true
      let itValue = it.next()
      try {
        while (!itValue.done) {
          itValue = it.next()
          storeCurrentStatus(context, it, this)
          if(debug && context.debugger.toggled) {
            itValue = dummyItValue
          }
        }
      } catch (e) {
        resolve({ status: 'error' })
      } finally {
        context.runtime.isRunning = false
      }
      resolve((debug && context.debugger.toggled) ? {
        status: 'suspended',
        it: it,
        scheduler: this,
        context: context
      } : {
        status: 'finished',
        value: itValue.value
      })
    })
  }
}

export class PreemptiveScheduler implements Scheduler {
  constructor(public steps: number) {
    this.run = this.run.bind(this)
  }

  public run(it: IterableIterator<Value>, context: Context, debug: boolean = true): Promise<Result> {
    return new Promise((resolve, reject) => {
      context.runtime.isRunning = true
      let itValue = it.next()
      let interval: number
      interval = setInterval(() => {
        let step = 0
        try {
          while (!itValue.done && step < this.steps) {
            itValue = it.next()
            storeCurrentStatus(context, it, this)
            if(debug && context.debugger.toggled) {
              itValue = dummyItValue
            }
            step++
          }
        } catch (e) {
          if (/Maximum call stack/.test(e.toString())) {
            const frames = context.runtime.frames
            const stacks: any = []
            let counter = 0
            for (
              let i = 0;
              counter < MaximumStackLimitExceeded.MAX_CALLS_TO_SHOW && i < frames.length;
              i++
            ) {
              if (frames[i].callExpression) {
                stacks.unshift(frames[i].callExpression)
                counter++
              }
            }
            context.errors.push(new MaximumStackLimitExceeded(context.runtime.nodes[0], stacks))
          }
          context.runtime.isRunning = false
          clearInterval(interval)
          resolve({ status: 'error' })
        }
        if (itValue.done) {
          context.runtime.isRunning = false
          clearInterval(interval)
          resolve((debug && context.debugger.toggled) ? {
            status: 'suspended',
            it: it,
            scheduler: this,
            context: context
          } : {
            status: 'finished',
            value: itValue.value
          })
        }
      })
    })
  }
}
