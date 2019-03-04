/* tslint:disable:max-classes-per-file */
import { MaximumStackLimitExceeded } from './interpreter-errors'
import { Context, Result, Scheduler, Value } from './types'
import { storeCurrentStatus } from './debugger';

export class AsyncScheduler implements Scheduler {
  public constructor() {
    this.run = this.run.bind(this)
  }

  public run(it: IterableIterator<Value>, context: Context): Promise<Result> {
    let thisScheduler = this
    return new Promise((resolve, reject) => {
      context.runtime.isRunning = true
      let itValue = it.next()
      try {
        while (!itValue.done) {
          itValue = it.next()
          if(context.debugger.toggled) {
            break
          }
        }
      } catch (e) {
        resolve({ status: 'error' })
      } finally {
        storeCurrentStatus(context, it, thisScheduler)
        context.runtime.isRunning = false
      }
      storeCurrentStatus(context, it, thisScheduler)
      if (itValue.done) {
        context.runtime.isRunning = false
        resolve({ status: 'finished', value: itValue.value })
      } else if(context.debugger.toggled) {
          resolve({
            status: 'suspended',
            it: it,
            scheduler: this,
            context: context
        })
      }
    })
  }
}

export class PreemptiveScheduler implements Scheduler {
  constructor(public steps: number) {
    this.run = this.run.bind(this)
  }

  public run(it: IterableIterator<Value>, context: Context): Promise<Result> {
    return new Promise((resolve, reject) => {
      context.runtime.isRunning = true
      let itValue = it.next()
      let thisScheduler = this
      function interval() {
        setTimeout(
          function setTimeOutLoop() {
            let step = 0
            try {
              while (step < thisScheduler.steps && !itValue.done) {
                itValue = it.next()
                if(context.debugger.toggled) {
                  break
                }
                step++
              }
            } catch (e) {
              if (/Maximum call stack/.test(e.toString())) {
                const environments = context.runtime.environments
                const stacks: any = []
                let counter = 0
                for (
                  let i = 0;
                  counter < MaximumStackLimitExceeded.MAX_CALLS_TO_SHOW && i < environments.length;
                  i++
                ) {
                  if (environments[i].callExpression) {
                    stacks.unshift(environments[i].callExpression)
                    counter++
                  }
                }
                context.errors.push(new MaximumStackLimitExceeded(context.runtime.nodes[0], stacks))
              }
              context.runtime.isRunning = false
              storeCurrentStatus(context, it, thisScheduler)
              resolve({ status: 'error' })
            }
            context.runtime.isRunning = false
            storeCurrentStatus(context, it, thisScheduler)
            if (itValue.done) {
              resolve({ status: 'finished', value: itValue.value })
            } else if(context.debugger.toggled) {
                resolve({
                  status: 'suspended',
                  it: it,
                  scheduler: thisScheduler,
                  context: context
                })
            } else {
              interval()
            }
          }
        )
      }
      interval()
    })
  }
}
