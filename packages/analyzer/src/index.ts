#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync, writeFileSync } from 'node:fs'
import { analyze } from './analyzer.js'
import { loadRcConfig, mergeWithRc } from './rc.js'

const program = new Command()

program
  .name('archflow')
  .description('Archflow — Static dependency analyzer for TypeScript/JavaScript projects')
  .version('0.1.0')

program
  .command('analyze')
  .description('Analyze a project and output dependency graph as JSON')
  .option('--root <path>', 'Root directory of source files')
  .option('--tsconfig <path>', 'Path to tsconfig.json')
  .option('--include <patterns...>', 'Glob patterns to include')
  .option('--exclude <patterns...>', 'Additional patterns to exclude')
  .option('-o, --output <file>', 'Output file path (default: stdout)')
  .option('--verbose', 'Show progress information')
  .option('--no-rc', 'Ignore .archflowrc.json')
  .action((opts: {
    root?: string
    tsconfig?: string
    include?: string[]
    exclude?: string[]
    output?: string
    verbose?: boolean
    rc?: boolean
  }) => {
    const rc = opts.rc !== false ? loadRcConfig() : null

    if (rc && opts.verbose) {
      console.error('Using .archflowrc.json')
    }

    const merged = mergeWithRc(opts, rc)

    if (opts.verbose) {
      console.error(`Analyzing ${merged.root}...`)
    }

    try {
      const result = analyze({
        rootDir: merged.root,
        tsconfigPath: merged.tsconfig,
        include: merged.include,
        exclude: merged.exclude,
        verbose: opts.verbose,
      })

      const json = JSON.stringify(result, null, 2)

      if (merged.output) {
        writeFileSync(merged.output, json, 'utf-8')
        if (opts.verbose) {
          console.error(
            `Done. ${result.metadata.nodeCount} nodes, ${result.metadata.edgeCount} edges → ${merged.output}`,
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

program
  .command('embed')
  .description('Run analysis and embed result into archflow.config.json')
  .option('--config <path>', 'Path to archflow.config.json')
  .option('--verbose', 'Show progress information')
  .action((opts: { config?: string; verbose?: boolean }) => {
    const rc = loadRcConfig()
    const configPath = opts.config ?? rc?.config

    if (!configPath) {
      console.error('No config path. Specify --config or set "config" in .archflowrc.json')
      process.exit(1)
    }

    const merged = mergeWithRc({}, rc)

    if (opts.verbose) {
      console.error(`Analyzing ${merged.root}...`)
    }

    try {
      const result = analyze({
        rootDir: merged.root,
        tsconfigPath: merged.tsconfig,
        include: merged.include,
        exclude: merged.exclude,
        verbose: opts.verbose,
      })

      const configContent = readFileSync(configPath, 'utf-8')
      const config = JSON.parse(configContent) as Record<string, unknown>
      config['analysis'] = result

      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')

      if (opts.verbose) {
        console.error(
          `Embedded ${result.metadata.nodeCount} nodes, ${result.metadata.edgeCount} edges → ${configPath}`,
        )
      } else {
        console.error(`Done → ${configPath}`)
      }
    } catch (err) {
      console.error(
        'Embed failed:',
        err instanceof Error ? err.message : String(err),
      )
      process.exit(1)
    }
  })

program.parse()
