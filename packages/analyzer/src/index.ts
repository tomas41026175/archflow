#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync, writeFileSync } from 'node:fs'
import { analyze } from './analyzer.js'
import { scanProject, generateConfig } from './scanner.js'
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

program
  .command('init')
  .description('Scan a project and generate archflow.config.json from source code')
  .option('--root <path>', 'Root directory of source files (default: ./src or .)')
  .option('--tsconfig <path>', 'Path to tsconfig.json (for dependency analysis)')
  .option('-o, --output <file>', 'Output path (default: ./archflow.config.json)')
  .option('--with-analysis', 'Also run dependency analysis and embed it')
  .option('--verbose', 'Show progress information')
  .action((opts: {
    root?: string
    tsconfig?: string
    output?: string
    withAnalysis?: boolean
    verbose?: boolean
  }) => {
    const rootDir = opts.root ?? './src'
    const outputPath = opts.output ?? './archflow.config.json'

    try {
      if (opts.verbose) {
        console.error(`Scanning ${rootDir}...`)
      }

      const scan = scanProject(rootDir)

      if (opts.verbose) {
        console.error(`  Project: ${scan.projectName}`)
        console.error(`  Tech: ${scan.techStack.framework ?? 'unknown'}`)
        console.error(`  Layers: ${scan.layers.length}`)
        console.error(`  Modules: ${scan.layers.reduce((sum, l) => sum + l.modules.length, 0)}`)
        console.error(`  Routes: ${scan.routes.length}`)
        console.error(`  Stores: ${scan.stateFlows.stores.length}`)
      }

      let analysis: unknown = undefined
      if (opts.withAnalysis) {
        if (opts.verbose) console.error(`  Running dependency analysis...`)
        analysis = analyze({
          rootDir,
          tsconfigPath: opts.tsconfig,
          exclude: ['__tests__', '__fixtures__', '__mock__', '__mocks__', '_tests_', 'mocks', '.test.', '.spec.', '.d.ts'],
        })
        const meta = (analysis as { metadata: { nodeCount: number; edgeCount: number } }).metadata
        if (opts.verbose) console.error(`  Analysis: ${meta.nodeCount} nodes, ${meta.edgeCount} edges`)
      }

      const config = generateConfig(scan, analysis)
      writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
      console.error(`Generated → ${outputPath}`)
    } catch (err) {
      console.error(
        'Init failed:',
        err instanceof Error ? err.message : String(err),
      )
      process.exit(1)
    }
  })

program.parse()
