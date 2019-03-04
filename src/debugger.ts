import * as es from 'estree'
import { Context, Result, Scheduler, Value} from './types'
export var DebugLocation: es.SourceLocation | null | undefined
export var lastContext: Context
export var dummyItValue = {value: "DEBUGGER TOGGLED", done: true, debugger: true}

export function toggleDebugger(node: es.DebuggerStatement, context: Context) {
    if(context.debugger.enabled) {
        context.debugger.toggled = true
        context.runtime.isRunning = false
    }
}

export function manualToggleDebugger(context: Context): Result {
    if(context.debugger.enabled) {
        lastContext = context
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
    if(context.debugger.enabled) {
        lastContext = context
        context.debugger.lastIt = it
        context.debugger.lastScheduler = scheduler
    }
}

// export function debuggerNext(context: Context = lastContext): void {
// }


export function resumeProgram(context: Context = lastContext): Promise<Result> {
    context.debugger.toggled = false
    return context.debugger.lastScheduler.run(context.debugger.lastIt, context)
}

export function resumeDebugger(context: Context): void {
    context.debugger.toggled = true
}

export function resetDebugger(context: Context): void {
    context.debugger.toggled = false
}

export function enableDebugger(context: Context = lastContext): void {
    context.debugger.enabled = true
}

export function disableDebugger(context: Context = lastContext): void {
    context.debugger.enabled = false
}