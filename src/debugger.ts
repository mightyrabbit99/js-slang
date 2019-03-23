import * as es from 'estree'
import { Context, DebuggerMode, Result, Scheduler, Value} from './types'
// let DebugLocation: es.SourceLocation | null | undefined
let lastContext: Context
let editorBreakpointsArray: string[] = []
let lastReachedBreakpointLine: number = -1
let lastNodeLength: number = 1
let stepOutAlready: boolean = false
let currentlyInsideFunction: es.Node
let functionNodes: es.Node[] = []
let debugMode: DebuggerMode = "DEBUG_RESUME"

export function toggleDebugger(node: es.Node, context: Context) {
    if(context.debugger.enabled) {
        if(node.loc) {
            lastReachedBreakpointLine = node.loc.start.line
        }
        lastNodeLength = context.runtime.nodes.length
        context.debugger.toggled = true
        context.runtime.isRunning = false
        stepOutAlready = false
    }
}

export function manualToggleDebugger(context: Context): Result {
    if(context.debugger.enabled) {
        lastContext = context
        lastNodeLength = context.runtime.nodes.length
        if(context.runtime.nodes[0].loc) {
            lastReachedBreakpointLine = context.runtime.nodes[0].loc.start.line
        }
        context.debugger.toggled = true
        context.runtime.isRunning = false
        stepOutAlready = false
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

export function checkStepOut(context: Context) {
    if(context.debugger.enabled) {
        if(context.runtime.nodes[0] && context.runtime.nodes[0].type === "CallExpression") {
            if(currentlyInsideFunction === context.runtime.nodes[0]) {
                stepOutAlready = true
            }
            functionNodes.shift()
        }
    }
}

export function checkStepIn(context: Context) {
    if(context.debugger.enabled) {
        if(context.runtime.nodes[0] && context.runtime.nodes[0].type === "CallExpression") {
            functionNodes.unshift(context.runtime.nodes[0])
        }
    }
}

export function checkBreakpointHit(node: es.Node, context: Context) {
    if(context.debugger.enabled 
        && node.type !== "Program" 
        && node.type !== "BlockStatement" 
        && node.type !== "DebuggerStatement"
        && node.type !== "IfStatement") {
        if(lastReachedBreakpointLine !== -1) {
            if(node.loc && node.loc.start.line !== lastReachedBreakpointLine) {
                switch(debugMode) {
                    case "DEBUG_NEXT" : {
                        toggleDebugger(node, context)
                        break
                    }
                    case "DEBUG_STEP_OVER" : {
                        if(context.runtime.nodes.length <= lastNodeLength) {
                            toggleDebugger(node, context)
                        }
                        break
                    }
                    case "DEBUG_STEP_OUT" : {
                        if(stepOutAlready) {
                            toggleDebugger(node, context)
                        }
                        break
                    }
                    default : {
                        lastReachedBreakpointLine = -1
                    }
                }
            }
        } else {
            if(node.loc && typeof editorBreakpointsArray[node.loc.start.line - 1] !== typeof undefined) {
                toggleDebugger(node, context)
            }
        }
    }
}

export function storeCurrentStatus(context: Context, it: IterableIterator<Value>, scheduler: Scheduler) {
    if(context.debugger.enabled) {
        lastContext = context
        context.debugger.lastIt = it
        context.debugger.lastScheduler = scheduler
    }
}

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

export function setBreakpointByLine(rows: string[]) {
    editorBreakpointsArray = rows;
}

export function setDebuggerMode(s: DebuggerMode) {
    currentlyInsideFunction = functionNodes[0]
    debugMode = s
}