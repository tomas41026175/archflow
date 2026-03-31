#!/usr/bin/env node

import { Command } from 'commander'
import { writeFileSync } from 'node:fs'
import { analyze } from './analyzer.js'

const program = new Command()

program
  .name('archflow')
  .description('Archflow — Static dependency analyzer for TypeScript/JavaScript projects')
  .version('0.1.0')

program
  .command('analyze')
  .description('Analyze a project and output dependency graph as JSON')
  .requiredOption('--root <path>', 'Root directory of source files')
  .option('--tsconfig <path>', 'Path to tsconfig.json')
  .option('--include <patterns...>', 'Glob patterns to include')
  .option('--exclude <patterns...>', 'Additional patterns to exclude')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('--verbose', 'Show progress information')
  .action((opts: {
    root: string
    tsconfig?: string
    include?: string[]
    exclude?: string[]
    output?: string
    verbose?: boolean
  }) => {
    if (opts.verbose) {
      console.error(`Analyzing ${opts.root}...`)
    }

    try {
      const result = analyze({
        rootDir: opts.root,
        tsconfigPath: opts.tsconfig,
        include: opts.include,
        exclude: opts.exclude,
        verbose: opts.verbose,
      })

      const json = JSON.stringify(result, null, 2)

      if (opts.output) {
        writeFileSync(opts.output, json, 'utf-8')
        if (opts.verbose) {
          console.error(
            `Done. ${result.metadata.nodeCount} nodes, ${result.metadata.edgeCount} edges → ${opts.output}`,
          )
        }
      } else {
        process.stdout.write(json + '\n')
      }
    } catch (err) {
      console.error(
        'Analysis failed:',
        err instanceof Error ? err.message : String(err),
      )
      process.exit(1)
    }
  })

program.parse()
