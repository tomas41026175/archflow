# Archflow — Handoff Document

> 最後更新：2026-03-31 | Phase 1 + Phase 2 + UI/UX 優化 完成

## 當前狀態

Phase 1 + 2 + UI/UX 優化 **全部完成**。

已驗證：
- `pnpm typecheck` — 全部通過
- `pnpm test` — 47 個測試全部通過（41 app + 6 analyzer）
- `pnpm dev` — localhost:5173 正常啟動
- `archflow embed` — 自動分析 + 嵌入 config
- 4 個視圖全部可用 + localStorage 持久化

## 功能清單

| 功能 | 說明 |
|------|------|
| Architecture 視圖 | 多層架構 + Legend + smoothstep 箭頭邊 + connections API 合約邊（紅色虛線） |
| Routes 視圖 | 樹狀路由 + HTTP method badge + guard lock icon |
| State Flows 視圖 | stores → consumers，邊色彩區分 read(藍)/write(橙)/read-write(紫) |
| Dependencies 視圖 | 自動分析 import/export + 嵌入 config 或獨立拖入 |
| File Editor | File System Access API + CodeMirror 6，支援 CRUD |
| Cmd+K 搜尋 | 搜尋 modules/stores → 自動切視圖 + select 節點 |
| localStorage | config + activeView 持久化，重新整理不遺失 |
| .archflowrc.json | CLI 設定檔，零參數 `archflow embed` |
| 範例一鍵載入 | 空狀態頁面「Load MAYOForm example」按鈕 |
| Legend | Architecture 視圖右上角色塊圖例 |

## CLI 命令

```bash
archflow analyze --root ./src              # 分析 → stdout
archflow analyze --root ./src -o deps.json # 分析 → 檔案
archflow embed --verbose                   # 分析 + 嵌入 config（讀 .archflowrc.json）
archflow embed --config ./path.json        # 指定 config 路徑
```

## Config Schema 摘要

```
version: 1
project: { name, description }
layers[]: { id, label, color, order, modules[] }        → Architecture 視圖
routes: { framework, entries[] }                         → Routes 視圖
stateFlows: { library, stores[], flows[] }               → State Flows 視圖
connections[]: { from, to, protocol, method, endpoint }  → Architecture 視圖（紅色 API 合約邊）
analysis: { nodes[], edges[] }                           → Dependencies 視圖（archflow embed 自動產生）
```

## 架構決策記錄

| 決策 | 選擇 | 原因 |
|------|------|------|
| layers | 陣列（非固定 key） | 支援 2-N 層自訂 |
| connections | 獨立 section（非 dependsOn） | 語意區分同系統依賴 vs 跨系統 API |
| dagre | @dagrejs/dagre v3（社群 fork） | 原 dagre archived。Fallback: elkjs |
| 持久化 | localStorage（非 IndexedDB） | config JSON 大小可控 |
| 檔案查看 | File System Access API + readwrite | 支援 CRUD，不需 backend |
| 節點 registry | nodes/registry.ts 集中註冊 | FlowCanvas 不直接 import 節點 |
| 頁面載入 | React.lazy + Suspense | 減少 App.tsx 依賴 |

## 尚未完成（Phase 3）

- [ ] 深色模式（CSS variables 已預留）
- [ ] PNG/SVG 匯出
- [ ] 佈局持久化（拖拉後的節點位置存 localStorage）
- [ ] 層級/tags 篩選面板
- [ ] 多專案切換（Sidebar dropdown）
- [ ] AI 輔助生成 config 的 prompt template

## 已知問題

1. **Zod v4**：API 大致與 v3 相容，若遇型別推導問題參考 zod.dev/v4
2. **shadcn/ui 尚未安裝**：目前手寫 Tailwind CSS，需要 Dialog/Sheet 元件時再 init
3. **檔案查看路徑搜尋**：遞迴最多 3 層子目錄，超深巢狀可能找不到

## 快速上手

```bash
cd ~/work/archflow
pnpm install
pnpm dev
# 開啟 http://localhost:5173
# 點「Load MAYOForm example」或拖入 examples/archflow/archflow.config.json
```
