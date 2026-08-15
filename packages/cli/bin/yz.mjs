#!/usr/bin/env node
// yz CLI 入口：Node 22.18+ 原生 type stripping 直接加载 TS 源码
import { run } from '../src/cli.ts'

run(process.argv.slice(2))
