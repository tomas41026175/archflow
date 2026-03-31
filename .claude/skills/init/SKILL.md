# init

從目標專案原始碼自動產生 archflow.config.json。

## Usage

```
/init <project-root> [--with-analysis]
```

## Steps

1. 確認 analyzer 已 build
2. 執行掃描：
   ```bash
   node packages/analyzer/dist/index.js init \
     --root <project-root>/src \
     --tsconfig <project-root>/tsconfig.json \
     --with-analysis \
     -o <output-path> \
     --verbose
   ```
3. 驗證產出：檢查 layers/routes/stateFlows/analysis 各 section 有資料
4. 載入到 web UI 確認 4 個視圖正常
