# Archflow — Handoff Document

> 最後更新：2026-03-30 | Phase 1a 完成

## 當前狀態

Phase 1a **已完成**：專案骨架 + 三層架構視圖的核心路徑。

已驗證：
- `pnpm typecheck` — 通過
- `pnpm dev` — localhost:5173 正常啟動
- 範例 config 結構完整（`examples/mayoform/archflow.config.json`）

## 已完成項目

| 項目 | 狀態 | 關鍵檔案 |
|------|------|---------|
| pnpm workspace monorepo | Done | `pnpm-workspace.yaml`, root `package.json` |
| Vite + React + TS 初始化 | Done | `packages/app/` |
| Tailwind v4 + CSS variables | Done | `src/index.css` (使用 `@theme` 語法) |
| Zod schema (config 型別定義) | Done | `src/lib/schema/config.ts` |
| Zustand store | Done | `src/stores/useProjectStore.ts` |
| Config 拖拉上傳 + 驗證 | Done | `src/hooks/useConfigLoader.ts`, `ConfigDropZone.tsx` |
| 錯誤 toast | Done | `src/components/panels/ErrorBanner.tsx` |
| React Flow 畫布 | Done | `src/components/canvas/FlowCanvas.tsx` |
| LayerGroupNode | Done | `src/components/nodes/LayerGroupNode.tsx` |
| ModuleNode | Done | `src/components/nodes/ModuleNode.tsx` |
| configToLayerNodes transform | Done | `src/lib/transforms/configToLayerNodes.ts` |
| dagre 佈局 | Done | `src/lib/layout/dagre.ts` |
| DetailPanel | Done | `src/components/panels/DetailPanel.tsx` |
| Sidebar (4 視圖導航) | Done | `src/components/layout/Sidebar.tsx` |
| LayerViewPage | Done | `src/pages/LayerViewPage.tsx` |
| 範例 config | Done | `examples/mayoform/archflow.config.json` |
| analyzer package 骨架 | Done | `packages/analyzer/` (placeholder) |

## 尚未完成（下一步）

### Phase 1b — DetailPanel 互動完善
- [ ] 節點選中時高亮 + 相關邊高亮
- [ ] Zod error 顯示具體欄位 + 行號提示
- [ ] DetailPanel 的 VSCode 跳轉需要完整檔案路徑（目前是 glob pattern）

### Phase 1c — 靜態分析 + 依賴視圖
- [ ] `packages/analyzer/` 完整實作（ts-morph 解析 import/export）
- [ ] CLI: `archflow analyze --root ./src --tsconfig ./tsconfig.json -o deps.json`
- [ ] 依賴視圖頁面 (`DependencyViewPage.tsx`)
- [ ] FileNode 自訂節點
- [ ] Analyzer fixture tests

### Phase 2 — 路由 + 狀態 + 搜尋
- [ ] RouteViewPage + RouteNode + RouteGroupNode
- [ ] StateFlowViewPage + StateStoreNode
- [ ] Cmd+K 搜尋
- [ ] 篩選（層級、tags）

## 已知問題 & 注意事項

1. **Zod v4**：專案安裝的是 Zod 4.3（非 v3），API 大致相容但若遇到型別推導問題，參考 [Zod v4 migration](https://zod.dev/v4)
2. **dagre 佈局目前未在三層視圖中使用**：`configToLayerNodes.ts` 用手動計算位置（因為三層是固定橫向排列），dagre 工具保留給依賴視圖使用
3. **Vitest 尚未安裝在 app package**：`package.json` 有 test scripts 但 vitest 還未加入 devDependencies，Phase 1b 開始測試前需 `pnpm add -D vitest`
4. **shadcn/ui 元件尚未安裝**：目前手寫 Tailwind CSS，shadcn CLI init 尚未執行。若需要 Sheet/Command/Dialog 等元件，需先跑 shadcn init
5. **`pnpm build` 在 analyzer 會失敗**：因為 `dist/index.js` 不存在，bin 連結會 warn（不影響 app）

## 架構決策記錄

| 決策 | 選擇 | 原因 | 替代方案 |
|------|------|------|---------|
| layers 結構 | 陣列（非固定 3 key） | 通用性：支援 2-N 層自訂 | 原 plan 為 `presentation/businessLogic/dataAccess` 三 key |
| dagre fork | @dagrejs/dagre v3 | 原 dagre 已 archived (2018) | elkjs（更強但 API 複雜） |
| Zod 版本 | v4 (pnpm 解析到 4.3) | 最新穩定版 | 可 pin 回 v3 若有相容問題 |
| Schema SSOT | Zod → JSON Schema 自動生成 | 避免手動維護兩份 schema | 手動寫 JSON Schema |
| 字體 | @fontsource self-hosted | 離線可用 | Google Fonts CDN |

## 快速上手

```bash
cd ~/work/archflow
pnpm install
pnpm dev
# 開啟 http://localhost:5173
# 拖入 examples/mayoform/archflow.config.json 測試
```
