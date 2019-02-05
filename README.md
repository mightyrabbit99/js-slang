# js-slang
[![Build Status](https://travis-ci.org/source-academy/js-slang.svg?branch=master)](https://travis-ci.org/source-academy/js-slang) 
[![Coverage Status](https://coveralls.io/repos/github/source-academy/js-slang/badge.svg?branch=master)](https://coveralls.io/github/source-academy/js-slang?branch=master) 

An open-source interpreter for the *Source* programming language. Debugger edition.

## Debugger
To set a breakpoint, use the builtin function `__breakpoint()`.

## Building

To build,
```
  $ git clone https://github.com/source-academy/js-slang.git
  $ cd slang
  $ yarn
  $ yarn build
```
To try out *Source* in a REPL, run

```
  $ node dist/repl/repl.js [chapter] # default: 1
```
or alternatively, install js-slang and run
```
  $ npm -g install js-slang   # Install js-slang
  $ js-slang [chapter] # default: 1
```
