# Archflow

Interactive project architecture visualization tool.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2 + Vite 8.0 + TypeScript 5.9 strict |
| Styling | Tailwind CSS 4.2 + CSS variables (shadcn/ui compatible) |
| Graph Rendering | @xyflow/react 12.10 (React Flow) |
| Layout Engine | @dagrejs/dagre 3.0 |
| State Management | Zustand 5.0 |
| Config Validation | Zod 4.3 (SSOT) → zod-to-json-schema for IDE support |
| Static Analysis | ts-morph (CLI tool, Phase 1c) |
| Package Manager | pnpm 10.x workspace |

## Repository Structure

```
archflow/
├── packages/
│   ├── app/                    # Vite + React SPA
│   │   └── src/
│   │       ├── pages/          # View pages (LayerViewPage, etc.)
│   │       ├── components/
│   │       │   ├── layout/     # AppShell, Sidebar
│   │       │   ├── canvas/     # FlowCanvas (React Flow wrapper)
│   │       │   ├── nodes/      # Custom React Flow nodes
│   │       │   └── panels/     # DetailPanel, ConfigDropZone, ErrorBanner
│   │       ├── stores/         # Zustand stores
│   │       ├── hooks/          # useConfigLoader, etc.
│   │       ├── lib/
│   │       │   ├── transforms/ # config → React Flow nodes/edges
│   │       │   ├── layout/     # dagre layout utilities
│   │       │   └── schema/     # Zod schemas (SSOT for all types)
│   │       └── types/          # UI-only TypeScript types
│   └── analyzer/               # CLI static analysis tool (Phase 1c)
├── schemas/                    # Auto-generated JSON Schema (IDE hints)
├── examples/                   # Example config files
└── pnpm-workspace.yaml
```

## Commands

```bash
pnpm dev                        # Start dev server (localhost:5173)
pnpm build                      # Build all packages
pnpm typecheck                  # TypeScript --noEmit check
pnpm lint                       # ESLint
pnpm test                       # Run all tests (Vitest)
pnpm test:coverage              # Tests with coverage report
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
- **Zustand stores**: project (config + view), fileSystem (CRUD). No unused stores — delete immediately if not referenced
- **Custom nodes**: extend `NodeProps` from @xyflow/react, use `cn()` for class merging
- **Node types registry** (`nodes/registry.ts`): all node type registrations in one place, FlowCanvas imports registry only
- **Lazy loading**: pages use `React.lazy` + `Suspense`, App.tsx should not directly import page components
- **Schema as SSOT**: Zod schemas define all data shapes, JSON Schema auto-generated

### Dependency Hygiene
- Run `archflow embed --verbose` after structural changes to update self-analysis
- `types/` must not contain unused interfaces — grep before committing
- New custom node → add to `nodes/registry.ts`, not FlowCanvas
- New page → add as `lazy(() => import(...))` in App.tsx, export as `default`
- Config/example data must reflect real project state — never fabricate data to fill empty views

### Testing
- Vitest for unit + component tests
- Transform functions: 100% coverage required
- Custom nodes: wrap in `ReactFlowProvider` for testing
- Analyzer: use fixture files (`__fixtures__/`), not mocks

### Git
- Commit format: `type(scope): description`
- No direct commits to main for features — use feature branches
- `pnpm typecheck` must pass before every commit

## Config JSON Format

The tool reads `archflow.config.json` files. Schema reference:

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
  "routes": { "framework": "nextjs", "entries": [...] },
  "stateFlows": { "library": "jotai", "stores": [...], "flows": [...] }
}
```

## Phase Status

- [x] Phase 1a — Core skeleton: config → layer architecture view
- [x] Phase 1b — DetailPanel interaction + error UX + 27 unit tests
- [x] Phase 1c — CLI static analysis (ts-morph) + dependency view + 6 analyzer tests
- [x] Phase 2 — Routes + state flows + Cmd+K search (47 tests total)
- [ ] Phase 3 — Multi-project, dark mode, export, AI config generation
