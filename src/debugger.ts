import * as es from 'estree'
import { Context, Frame, Result, Scheduler, Value} from './types'
export var DebugLocation: es.SourceLocation | null | undefined
export var lastContext: Context
export var dummyItValue = {value: "DEBUGGER TOGGLED", done: true, debugger: true}
export var user_defined_frames: Frame[] = []

export function toggleDebugger(node: es.DebuggerStatement, context: Context) {
    if(!context.debugger.disabled) {
        context.debugger.toggled = true
        context.runtime.isRunning = false
    }
}

export function manualToggleDebugger(context: Context): Result {
    if(!context.debugger.disabled) {
        context.debugger.toggled = true
        context.runtime.isRunning = false
        return {
            status: 'suspended',
            it: context.debugger.lastIt,
            scheduler: context.debugger.lastScheduler,
            context: context
        }
    } else {
        return { status: 'error' }
    }
}

export function storeCurrentStatus(context: Context, it: IterableIterator<Value>, scheduler: Scheduler) {
    if(!context.debugger.disabled) {
        context.debugger.lastIt = it
        context.debugger.lastScheduler = scheduler
    }
}

export function debuggerNext(context: Context = lastContext): void {
}


export function resumeProgram(context: Context = lastContext): Promise<Result> {
    if(context.debugger.toggled) {
        context.debugger.toggled = false
        context.errors.pop()
        return context.debugger.lastScheduler.run(context.debugger.lastIt, context, true)
    } else {
        return Promise.resolve({ status: 'error' } as Result)
    }
}

export function temporaryDisableDebugger(context: Context): void {
    context.debugger.toggled = false
    disableDebugger(context)
    // tslint:disable-next-line:no-console
    console.log(context.debugger.disabled + "temp" + context.debugger.toggled)
}

export function resumeDebugger(context: Context): void {
    context.debugger.toggled = true
    activateDebugger(context)
}

export function resetDebugger(context: Context): void {
    context.debugger.toggled = false
    activateDebugger(context)
}

export function activateDebugger(context: Context): void {
    context.debugger.disabled = false
}

export function disableDebugger(context: Context): void {
    context.debugger.disabled = true
}