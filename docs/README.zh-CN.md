# clawpage-skill（中文说明）

英文版本见：[../README.md](../README.md)。

`clawpage-skill` 用于把长文本快速转成可交互的 Clawpage 页面。  
你可以直接描述目标页面，skill 会自动路由到创建/更新页面或模板流程，并发布可访问 URL。

官网：`https://clawpage.ai`

## 可以完成什么

- 将长篇股票市场分析转成图表化仪表盘
- 生成洞察页、工具页、互动页
- 基于 `pageId` 更新已有页面
- 发布时控制有效期与访问口令

## 快速开始

1. 初始化本地 key 文件：

```bash
cp keys.local.example.json keys.local.json
```

2. 如无 token，先注册：

```bash
curl -sS -X POST https://api.clawpage.ai/api/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"<username>"}'
```

用户名规则：
- 仅 `a-z` / `0-9` / `-`
- 长度至少 6 位
- 不能以 `-` 开头或结尾

如果返回 `409 USERNAME_TAKEN`：
- 提供 3 个新候选名
- 优先用 `-lab`、`-app` 或 2-4 位数字后缀
- 让用户选择后重试

3. 将 token 写入 `keys.local.json`：

```json
{
  "clawpage": {
    "token": "sk_replace_me",
    "apiHost": "https://api.clawpage.ai"
  }
}
```

## 场景示例：长股票分析文本 -> 生动图表页

给 Codex 的指令示例：

```text
使用 clawpage-skill 把下面这段股票分析长文做成可视化页面：
1) 提炼 5 个核心结论
2) 展示 KPI 和 7D/30D/90D 趋势切换
3) 移动端优先
4) 发布并返回 rootUrl、accessUrl、pageId、expiresAt
```

常见处理流程：
- 自动选模板（如 `stock-analysis-terminal`）
- 把长文结构化为摘要、风险、观察模块
- 写入 `.pages/<page-name>/`
- 调用发布脚本并返回链接和有效期

## 常用命令

模板 dry-run：

```bash
node scripts/clawpages_publish.mjs \
  --page-dir templates/general_template \
  --title "Template Preview" \
  --dry-run
```

发布页面：

```bash
node scripts/clawpages_publish.mjs \
  --page-dir .pages/<page-name> \
  --title "My Page" \
  --subtitle "Optional"
```

## 占位符与多语言

除 README 文档外，项目中的中文描述已替换为英文大写占位符。  
Skill 规则要求 LLM 在发布前根据用户偏好语言填充这些占位符内容。

## 安全提示

- 不要提交真实 `keys.local.json`
- 仅提交 `keys.local.example.json`

## License

本项目采用 MIT 开源协议，详见 `../LICENSE`。
