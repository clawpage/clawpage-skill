---
name: clawpages-update-page
description: 在现有 .pages 页面工程上做改版，优先用 index.md metadata 快速匹配；支持更新有效时长与 pagecode 后发布。
---

# ClawPages Update Page

## 何时使用

- 用户要改已有页面（结构、视觉、交互或内容）
- 用户提到“复用某页面/某项目”

## 目录与约定

- 页面目录：`../.pages/<page-name>`
- 每个页面包含：`index.md`, `index.html`, `default.css`, `default.js`
- 发布脚本：`../scripts/clawpages_publish.mjs`
- API 更新语义参考：`../references/api-quickref.md`（`PATCH /api/pages/<pageId>`）

## 匹配策略（两阶段）

1. 首轮仅读 metadata（不读全文）

```bash
find ../.pages -mindepth 2 -maxdepth 2 -name index.md | while read -r f; do
  echo "== $f ==";
  sed -n '1,24p' "$f";
done
```

2. 对候选页面再读完整 `index.md`，确认最终目标页面

## 改版流程

1. 编辑 `index.html`（主）
2. 根据需求改 `default.css` / `default.js`
3. 从 `index.md` 读取 `page-id`（若存在）：

```bash
PAGE_ID=$(sed -n 's/^[[:space:]]*page_id:[[:space:]]*//p; s/^- page-id：[[:space:]]*//p; s/^- page-id:[[:space:]]*//p' ../.pages/<page-name>/index.md | head -n 1 | tr -d '"')
```

4. 如语义发生变化，同步更新 `index.md` 的 metadata 与说明
5. 使用 update 能力发布（有 `page-id` 时走 PATCH）：

```bash
node ../scripts/clawpages_publish.mjs \
  --page-dir ../.pages/<page-name> \
  --page-id "$PAGE_ID" \
  --title "页面标题" \
  --subtitle "可选副标题"
```

可选：

- `--ttl-ms <number|null>`：修改有效时长；`null` 表示永久；不传表示不修改
- 访问口令使用 `--pagecode <text|null>`；`null` 表示移除口令保护

6. 返回用户

- 1-2 句摘要
- 页面 URL（`rootUrl`）
- 有效时间信息（读取 `ttlMsApplied` / `expiresAt`；若未修改需明确说明“未修改”）
- 访问保护状态（pagecode/protected；若未修改需明确说明“未修改”）
- 若本次设置了口令：返回本次口令或访问方式

## page-id 缺失时

- 若 `index.md` 没有 `page-id`，先提示用户该页面尚未绑定远端 pageId
- 可选择先创建一次页面拿到 `pageId`，再写回 `index.md`，后续走更新链路

## 质量要求

- 每个页面按 WebApp 处理，不退化成长文章
- 优先模块化面板、状态区、交互区
