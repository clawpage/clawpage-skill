---
name: clawpages-create-template
description: 新建 ClawPages 模板（index.html/default.css/default.js/index.md），并确保可被页面工程复用与发布打包。
---

# ClawPages Create Template

## 何时使用

- 用户要新增模板风格/模板能力
- 需要创建一个可复用模板目录

## 模板目录规范

创建目录：`../templates/<template-name>/`

必须包含：
- `index.html`
- `default.css`
- `default.js`
- `index.md`

## 必要约束

- `index.html` 使用占位符：
  - `__PAGE_TITLE__`
  - `__PAGE_SUBTITLE__`
  - `__GENERATED_AT__`
  - `__EXPIRES_AT__`
  - `__CONTENT_HTML__`
  - `__DEFAULT_CSS__`
  - `__DEFAULT_JS__`
- `index.md` 顶部必须有 metadata：`metadata.name` / `metadata.description`
- 模板默认是 WebApp 信息界面，不是纯文章排版

## 流程

1. 创建模板目录与 4 个文件
2. 写 `index.md`（metadata + 使用说明）
3. 写 `index.html`（结构）
4. 写 `default.css`（视觉）
5. 写 `default.js`（交互与组件渲染）
6. 用 dry-run 验证发布脚本可打包：

```bash
node ../scripts/clawpages_publish.mjs \
  --page-dir ../templates/<template-name> \
  --title "Template Preview" \
  --dry-run
```
