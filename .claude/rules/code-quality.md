# Code Quality

## Applicability

- Applies to: all code changes

## TypeScript

- `strict: true`，禁止 `any`
- Config types 一律用 `z.infer<typeof schema>`
- UI-only types 放 `types/`，schema types 放 `lib/schema/`

## File Organization

- 單一檔案不超過 400 行
- Schema 檔案不超過 10 exports
- Transform 函式必須是 pure function
- 每個 transform 必須有對應的 `__tests__/` 測試

## React Flow Patterns

- 新節點類型 → `nodes/registry.ts` 集中註冊
- FlowCanvas 不直接 import 個別節點
- 邊 id 必須全局唯一（用 index 前綴）
- 大資料集（>200 nodes）→ 使用 `useTransition` 避免 UI 阻塞

## Testing

- Transform functions: 100% coverage
- Schema: valid + invalid + edge cases
- Analyzer: fixture files，不 mock

## Pre-commit

```bash
pnpm typecheck && pnpm test
```
