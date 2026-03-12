---
name: clawpage-skill
description: ClawPages 路由技能。按用户意图分发到 create page / update page / create template / update template 四个子 skill。Use when user wants to create/update page or template and publish URL.
---

# ClawPages Skill (Router)

## 何时使用

- 用户要创建或改版 ClawPages 页面（WebApp 页面）
- 用户要创建或更新模板
- 用户要发布页面并获取可访问 URL

## 子 Skill 列表

1. `create page`
- 路径：`skills/create-page/SKILL.md`
- 用于：新建页面工程并发布（创建语义按最新 API：默认 TTL 6h、支持 pagecode）

2. `update page`
- 路径：`skills/update-page/SKILL.md`
- 用于：在存量页面上改版并发布（优先读 `index.md` 的 `page-id` 走 PATCH，支持修改 TTL/pagecode）

3. `create template`
- 路径：`skills/create-template/SKILL.md`
- 用于：新增模板目录与模板能力

4. `update template`
- 路径：`skills/update-template/SKILL.md`
- 用于：修改已有模板的结构/样式/交互/说明

## 分发规则

- 用户说“新建页面/做个新 page”：使用 `create page`
- 用户说“改这个页面/复用现有页面”：使用 `update page`
- 用户说“新建模板/做个新 template”：使用 `create template`
- 用户说“改模板/优化默认模板”：使用 `update template`

## 全局前置约定

- API 默认：`https://api.clawpage.ai`
- 预览 URL 模式：`https://u-[username].clawpage.ai/pages/[pageId]`
- key 文件：`keys.local.json`
- 页面目录：`.pages/<page-name>`
- 模板目录：`templates/<template-name>`
- 发布脚本：`scripts/clawpages_publish.mjs`
- API 语义参考：`references/api-quickref.md`

若 `keys.local.json` 不存在，先注册（`username` 必填）：

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"builder01"}'
```

获取 token 后存储到 `keys.local.json`：

```json
{
  "clawpages": {
    "token": "sk_replace_me",
    "apiHost": "https://api.clawpage.ai"
  }
}
```

## 通用发布命令

```bash
node scripts/clawpages_publish.mjs \
  --page-dir .pages/<page-name> \
  --title "页面标题" \
  --subtitle "可选副标题"
```

说明：创建页面默认有效期以最新 API 语义为准（未显式设置时默认 6h，即 `21600000` ms），可通过 `--ttl-ms` 覆盖。

## 输出约束

- 向用户返回 1-2 句摘要
- 返回页面 URL（`rootUrl`）
- 若页面受口令保护，同时返回可访问入口（`accessUrl` 或带 `pagecode` 的访问说明）
- 创建/更新页面都要返回：有效时间信息、是否受保护、若本次设置了口令则返回本次口令
- 发布失败时给出明确原因和可执行修复动作
