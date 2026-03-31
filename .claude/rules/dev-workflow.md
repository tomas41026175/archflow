# Development Workflow

## Applicability

- Applies to: all developers

## Self-Analysis Loop

每次結構性變更後必須執行自我分析迴圈：

```
1. 修改程式碼
2. pnpm typecheck && pnpm test
3. archflow embed --verbose（更新自我分析）
4. 比較 nodes/edges 變化
5. 若依賴增加 → 評估是否需要重構
```

## Dependency Hygiene

- `config.ts` 拆分後不可超過 10 exports/file
- 新 custom node → 加到 `nodes/registry.ts`，不直接 import 到 FlowCanvas
- 新 page → `React.lazy` + `export default`
- `types/` 不可有未使用的 interface — 提交前 grep 驗證
- 刪除 dead code 後立即 re-embed 確認 edges 減少

## Config Data Integrity

- Config/example 資料必須反映真實架構 — **禁止捏造資料填充空視圖**
- 技術棧資訊從 `package.json` 驗證，不從文件照抄
- `archflow init --with-analysis` 產生的 config 比手寫更可靠

## Violation

- 提交包含 unused types 的 PR → Violation
- 手動捏造 config 資料（非真實架構）→ Violation
- 結構性變更後未 re-embed → Violation
