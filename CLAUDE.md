# Archflow

Interactive project architecture visualization tool.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2 + Vite 8.0 + TypeScript 5.9 strict |
| Styling | Tailwind CSS 4.2 + CSS variables (shadcn/ui compatible) |
| Graph Rendering | @xyflow/react 12.10 (React Flow) |
| Layout Engine | @dagrejs/dagre 3.0 |
| State Management | Zustand 5.0 (persisted to localStorage) |
| Config Validation | Zod 4.3 (SSOT) → zod-to-json-schema for IDE support |
| Code Editor | CodeMirror 6 (@uiw/react-codemirror) |
| Static Analysis | ts-morph 24 (CLI tool) |
| Package Manager | pnpm 10.x workspace |

## Repository Structure

```
archflow/
├── .archflowrc.json              # CLI defaults (root, tsconfig, exclude)
├── packages/
│   ├── app/                      # Vite + React SPA
│   │   └── src/
│   │       ├── pages/            # 4 view pages (lazy loaded)
│   │       ├── components/
│   │       │   ├── layout/       # Sidebar
│   │       │   ├── canvas/       # FlowCanvas, Legend
│   │       │   ├── nodes/        # 7 custom nodes + registry.ts
│   │       │   └── panels/       # DetailPanel, CodeEditor, ConfigDropZone,
│   │       │                       ErrorBanner, SearchPanel
│   │       ├── stores/           # Zustand (project, fileSystem)
│   │       ├── hooks/            # useConfigLoader, useNodeSearch
│   │       ├── lib/
│   │       │   ├── transforms/   # config → React Flow nodes/edges (4 transforms)
│   │       │   ├── layout/       # dagre layout wrapper
│   │       │   └── schema/       # Zod schemas (config + analysis)
│   │       └── types/            # UI-only TypeScript types
│   └── analyzer/                 # CLI static analysis tool
│       └── src/
│           ├── index.ts          # CLI (analyze + embed commands)
│           ├── analyzer.ts       # ts-morph core
│           ├── rc.ts             # .archflowrc.json loader
│           └── types.ts          # AnalysisResult types
├── examples/
│   ├── archflow/                 # Self-analysis (dogfooding)
│   └── mayoform/                 # MAYOForm example
└── pnpm-workspace.yaml
```

## Commands

```bash
# Development
pnpm dev                          # Start dev server (localhost:5173)
pnpm build                        # Build all packages
pnpm typecheck                    # TypeScript --noEmit check
pnpm test                         # Run all tests (47 tests)

# Analyzer CLI
archflow analyze --root ./src     # Output dependency JSON to stdout
archflow analyze -o deps.json     # Output to file
archflow embed --verbose          # Analyze + embed into config (reads .archflowrc.json)
```

## 4 Views

| View | Data Source | Layout | Edge Style |
|------|-----------|--------|------------|
| Architecture | `layers[]` + `connections[]` | Manual columns + smoothstep arrows | Gray deps + red dashed API contracts |
| Routes | `routes.entries[]` | dagre TB tree | smoothstep arrows |
| State Flows | `stateFlows` | dagre LR | read=blue, write=orange, read-write=purple |
| Dependencies | `analysis` (embedded or drag-drop) | dagre LR | solid=runtime, dashed=type-only |

## Config JSON Format

```jsonc
{
  "version": 1,
  "project": { "name": "...", "description": "..." },
  "layers": [
    {
      "id": "presentation",
      "label": "Presentation Layer",
      "color": "#3B82F6",
      "order": 0,
      "modules": [{
        "id": "...", "name": "...", "description": "...",
        "type": "page|component|hook|service|util|api|store",
        "files": ["..."], "tags": ["..."],
        "dependsOn": ["other-module-id"]
      }]
    }
  ],
  "routes": {
    "framework": "nextjs|react-router|express",
    "entries": [{ "path": "/...", "name": "...", "method": "GET", "guard": "...", "children": [...] }]
  },
  "stateFlows": {
    "library": "jotai|zustand|redux",
    "stores": [{ "id": "...", "name": "...", "atoms": ["..."] }],
    "flows": [{ "from": "...", "to": "...", "direction": "read|write|read-write" }]
  },
  "connections": [
    {
      "from": "fe-api-module-id",
      "to": "be-controller-module-id",
      "protocol": "REST|GraphQL|gRPC|WebSocket",
      "method": "POST",
      "endpoint": "/api/form",
      "description": "Frontend submits form to backend"
    }
  ],
  "analysis": { /* embedded AnalysisResult from archflow embed */ }
}
```

## .archflowrc.json

```jsonc
{
  "analyzer": {
    "root": "./packages/app/src",
    "tsconfig": "./packages/app/tsconfig.app.json",
    "exclude": ["__tests__", "__fixtures__", ".test.", ".spec."]
  },
  "config": "./examples/archflow/archflow.config.json"
}
```

## Development Rules

### TypeScript
- `strict: true`, no `any` — use `unknown` + type guard
- Config types: always use `z.infer<typeof schema>`, never manual interfaces
- `types/` directory: only for UI-only types (React Flow node data, etc.)

### Styling
- Tailwind utility classes only — no inline styles, no CSS modules
- CSS variables for theming (shadcn/ui pattern)
- No responsive prefixes (`sm:`, `md:`, `lg:`) — desktop only (>= 1024px)
- Fonts: self-hosted via @fontsource (Inter + JetBrains Mono)

### Architecture Patterns
- **Transform functions** (`lib/transforms/`): pure functions, config → nodes/edges
- **Zustand stores**: project (config + view, persisted), fileSystem (CRUD). No unused stores — delete immediately
- **Custom nodes**: extend `NodeProps` from @xyflow/react, use `cn()` for class merging
- **Node types registry** (`nodes/registry.ts`): all node type registrations in one place, FlowCanvas imports registry only
- **Lazy loading**: pages use `React.lazy` + `Suspense`, App.tsx must not directly import page components
- **Schema as SSOT**: Zod schemas define all data shapes

### Dependency Hygiene
- Run `archflow embed --verbose` after structural changes to update self-analysis
- `types/` must not contain unused interfaces — grep before committing
- New custom node → add to `nodes/registry.ts`, not FlowCanvas
- New page → add as `lazy(() => import(...))` in App.tsx, export as `default`
- Config/example data must reflect real project state — never fabricate data to fill empty views

### Testing
- Vitest for unit + component tests (47 tests total)
- Transform functions: 100% coverage required
- Custom nodes: wrap in `ReactFlowProvider` for testing
- Analyzer: use fixture files (`__fixtures__/`), not mocks

### Git
- Commit format: `type(scope): description`
- No direct commits to main for features — use feature branches
- `pnpm typecheck` must pass before every commit

## Features

- **localStorage persistence**: config + activeView survive page refresh
- **File System Access API**: Set Project Root → CRUD files in-app via CodeMirror editor
- **Cmd+K search**: search modules/stores by name, description, tags → auto-navigate
- **Legend**: layer color key in Architecture view
- **connections**: cross-system API contracts rendered as red dashed animated edges
- **archflow embed**: one command to analyze + embed dependencies into config

## Phase Status

- [x] Phase 1a — Core skeleton: config → layer architecture view
- [x] Phase 1b — DetailPanel interaction + error UX + unit tests
- [x] Phase 1c — CLI static analysis (ts-morph) + dependency view + analyzer tests
- [x] Phase 2 — Routes + state flows + Cmd+K search
- [x] UI/UX — localStorage, Legend, edge colors, connections, search fitView
- [ ] Phase 3 — Dark mode, PNG/SVG export, layout persistence, AI config generation
