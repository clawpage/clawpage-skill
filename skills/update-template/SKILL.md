---
name: clawpages-update-template
description: 更新现有 ClawPages 模板（结构/样式/交互/说明），并保持 metadata-first 决策和打包兼容。
---

# ClawPages Update Template

## 何时使用

- 用户要改某个模板的 UI、交互、说明文档
- 用户提到“默认模板太丑/要改风格/要增强模板能力”

## 目录与约定

- 模板目录：`../templates/<template-name>`
- 文件：`index.html`, `default.css`, `default.js`, `index.md`

## 选择模板（两阶段）

1. 首轮仅读 `index.md` 头部 metadata（`metadata.name` / `metadata.description`）
2. 确认候选后再读完整 `index.md` 决定是否编辑

## 改版流程

1. 主要改 `index.html` 结构（保持占位符不丢失）
2. 改 `default.css` 视觉系统
3. 改 `default.js` 交互能力与渲染逻辑
4. 同步更新 `index.md`（metadata 与说明）
5. dry-run 验证：

```bash
node ../scripts/clawpages_publish.mjs \
  --page-dir ../templates/<template-name> \
  --title "Template Preview" \
  --dry-run
```

## 必须保持

- `index.html` 保留：`__PAGE_TITLE__`, `__PAGE_SUBTITLE__`, `__GENERATED_AT__`, `__EXPIRES_AT__`, `__DEFAULT_CSS__`, `__DEFAULT_JS__`, `__CONTENT_HTML__`
- 页面风格支持 WebApp 场景，不仅是文章页
