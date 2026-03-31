# embed

重新分析 Archflow 自身並嵌入 config（dogfooding）。

## Usage

```
/embed
```

## Steps

1. Build analyzer：`pnpm --filter @archflow/analyzer build`
2. 執行嵌入：`node packages/analyzer/dist/index.js embed --verbose`
3. 比較前後 nodes/edges 數量變化
4. 若 edges 增加 → 評估新依賴是否合理
