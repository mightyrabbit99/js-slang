import { evaluators } from '../interpreter'
import { Breakpoint } from '../interpreter-errors'
import { Context, Environment, Frame } from '../types'

export function __breakpoint() {
  console.log('Breakpoint hit')
}

export function* __expose(node: any, context: Context): any {
  const frames: Frame[] = context.runtime.frames
  const blockScope = frames[0]
  const globalScope = frames[frames.length - 1]
  console.log(blockScope)
  const readlineSync = require('readline-sync')
  readlineSync.keyInPause()
  return
}
