# Archflow — Handoff Document

> 最後更新：2026-03-31 | Phase 1 + Phase 2 完成

## 當前狀態

Phase 1 + 2 **全部完成**：4 個視圖 + Analyzer CLI + Cmd+K 搜尋。

已驗證：
- `pnpm typecheck` — 全部通過
- `pnpm test` — 47 個測試全部通過（41 app + 6 analyzer）
- `pnpm dev` — localhost:5173 正常啟動
- Analyzer CLI — `archflow analyze --root ./src` 正常產出 JSON
- 4 個視圖全部可用（Architecture / Routes / State Flows / Dependencies）

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

### Phase 1b — DetailPanel 互動完善 (DONE)
- [x] 節點選中時高亮 + 相關邊高亮（animated + color + opacity）
- [x] Zod error 顯示具體欄位路徑 + 錯誤計數
- [x] 27 個單元測試（Schema 18 + Transform 9）

### Phase 1c — 靜態分析 + 依賴視圖 (DONE)
- [x] Analyzer CLI 完整實作（ts-morph 解析 import/export + re-export）
- [x] CLI 支援 --root / --tsconfig / --include / --exclude / -o / --verbose
- [x] DependencyViewPage（獨立拖入 analysis JSON）
- [x] FileNode 自訂節點（檔案類型圖示 + 色彩）
- [x] 6 個 Analyzer fixture tests

### Phase 2 — 路由 + 狀態 + 搜尋 (DONE)
- [x] RouteViewPage + RouteNode + RouteGroupNode（dagre TB 佈局）
- [x] StateFlowViewPage + StateStoreNode + StateConsumerNode（dagre LR 佈局 + 動畫邊）
- [x] Cmd+K 搜尋面板（modules、stores、routes）
- [x] 14 個新測試（Route 7 + State 7）
- [x] 範例 config 加入 routes + stateFlows 完整資料

### Phase 3 — 進階（下一步）
- [ ] 多專案切換（localStorage + Sidebar dropdown）
- [ ] 深色模式
- [ ] PNG/SVG 匯出
- [ ] 佈局持久化
- [ ] VSCode 跳轉（`vscode://file/...` URI）
- [ ] 層級/tags 篩選面板

## 已知問題 & 注意事項

1. **Zod v4**：專案安裝的是 Zod 4.3（非 v3），API 大致相容但若遇到型別推導問題，參考 [Zod v4 migration](https://zod.dev/v4)
2. **dagre 佈局目前未在三層視圖中使用**：`configToLayerNodes.ts` 用手動計算位置（因為三層是固定橫向排列），dagre 工具保留給依賴視圖使用
3. **Vitest 已安裝**：app 和 analyzer 均已設定，33 個測試全部通過
4. **shadcn/ui 元件尚未安裝**：目前手寫 Tailwind CSS，shadcn CLI init 尚未執行。Phase 2 的 Command (Cmd+K) 需要 shadcn
5. **Analyzer build 正常**：`pnpm --filter @archflow/analyzer build` 可產生 `dist/`

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
