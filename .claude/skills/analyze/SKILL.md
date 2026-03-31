# analyze

分析目標專案並產生依賴圖 JSON。

## Usage

```
/analyze [--root <path>] [--tsconfig <path>] [-o <file>]
```

## Steps

1. 確認 analyzer 已 build：`pnpm --filter @archflow/analyzer build`
2. 執行分析：
   ```bash
   node packages/analyzer/dist/index.js analyze \
     --root ${ROOT:-./packages/app/src} \
     --verbose
   ```
3. 若有 `.archflowrc.json`，直接：
   ```bash
   node packages/analyzer/dist/index.js analyze --verbose
   ```
