---
name: clawpages-create-page
description: 新建一个 ClawPages 页面工程（从模板复制到 .pages），编辑 HTML/CSS/JS 并发布 URL；创建语义按最新 API（默认 TTL 6h、支持 pagecode）。
---

# ClawPages Create Page

## 何时使用

- 用户要“新建”页面，不是改已有页面
- 目标是交付可访问 URL 的 WebApp 页面

## 输入与约定

- 页面目录：`../.pages/<page-name>`
- 模板目录：`../templates/<template-name>`
- 发布脚本：`../scripts/clawpages_publish.mjs`
- API 语义参考：`../references/api-quickref.md`
- page-name 使用 kebab-case
- 创建默认 TTL：6h（`21600000`，未显式设置时）

## 流程

1. 选择模板（默认 `genernal_template`）
2. 复制模板：

```bash
cp -R ../templates/genernal_template ../.pages/<page-name>
```

3. 更新 `../.pages/<page-name>/index.md`
- 必填头部 metadata：`metadata.name`、`metadata.description`
- 补充页面用途、受众、场景

4. 编辑页面工程
- 重点改 `index.html`
- 需要时改 `default.css`、`default.js`
- 页面按 WebApp 思路设计，不按纯文章排版

5. 发布页面

```bash
node ../scripts/clawpages_publish.mjs \
  --page-dir ../.pages/<page-name> \
  --title "页面标题" \
  --subtitle "可选副标题"
```

可选：

- `--ttl-ms <number|null>`：覆盖默认有效期；`null` 表示永久
- 访问口令使用 `--pagecode <text|null>`；`null` 表示移除口令保护

6. 返回用户
- 1-2 句摘要
- 页面 URL（`rootUrl`）
- 若页面受保护：返回可访问入口（`accessUrl` 或带 `pagecode` 的说明）
- 有效时间信息（读取 `ttlMsApplied` / `expiresAt`）
- 是否受保护（protected/pagecode 状态）

7. 将返回的 `pageId` 回写到 `../.pages/<page-name>/index.md`（优先写 `metadata.page_id`，同时可同步 `page-id` 文本字段），便于后续 `update-page` 走 PATCH 更新链路

## 失败处理

- keys/token 问题：检查 `../keys.local.json`
- 若尚未注册，先执行：

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"builder01"}'
```

- 网络/API 问题：检查 `--api-host` 与响应错误体
