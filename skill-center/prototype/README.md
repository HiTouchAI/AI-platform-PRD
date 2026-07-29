# HiTouch Skill 中心一期原型

这是一个无需构建工具的桌面 Web 交互原型，用于验证 Skill 使用中心与轻量管理的完整闭环，包括范围配置、导入、更新、停用和重新启用。页面路径可交互，但不代表企微、ZIP、Git 或 Session 后端已经接入。

## 启动与入口

在项目根目录运行：

```bash
python3 -m http.server 4173 --directory "skill-center/prototype"
```

入口 URL：

- 工作台与首次重置：`http://127.0.0.1:4173/index.html?reset=1`
- 工作台：`http://127.0.0.1:4173/index.html`
- Skill 使用中心：`http://127.0.0.1:4173/skill-center.html`
- Skill 同页管理：`http://127.0.0.1:4173/skill-center.html?mode=manage`
- Hermes Session：`http://127.0.0.1:4173/session.html`
- 兼容入口：`../Skill中心一期Demo.html`

请通过 HTTP 服务访问，不要使用 `file://`。

## 页面与交互

`index.html` 是 HiTouch 工作台。常用功能区域中的 Skill 中心卡片显示当前用户可见数量并进入使用中心。

`skill-center.html` 的使用中心采用稳定卡片墙：

- 搜索展示名称、用途和系统保存的描述；
- 按全部、默认、我创建的筛选；
- 1280px 使用两列，1440px 及以上使用三列；
- 卡片主体进入详情，“使用”按钮先收集本次需求；
- 详情返回时保留搜索和筛选条件；
- 卡片和详情都不展示 Skill 描述、文件清单或文件内容。

`skill-center.html?mode=manage` 是同一 Skill 中心内的管理视图：

- 默认 Skill：搜索、从固定 `HiTouchAI/hitouch-skills` 仓库导入或 ZIP 上传、配置、更新内容、调整分配范围和停用/重新启用；新导入默认对全员开放并立即启用；
- 管理列表支持“全部 / 启用中 / 已停用”快捷 Tab，并与关键词搜索叠加生效；
- 范围配置使用“全员 / 指定范围”互斥模式；指定范围内可同时选择预置部门和人员，人员支持按姓名搜索并展示所属部门；
- 列表行内只保留“编辑”和“停用/重新启用”；正常启用项不展示冗余状态，已停用项显示弱提示；点击版本号查看版本记录，“更新内容”位于编辑抽屉；
- 管理页直接展示默认 Skill，不提供管理子导航、默认 Skill 删除或回收站；

`session.html` 消费一次使用流程，仅展示用户原始需求和正常对话内容。原型将 `selectedSkillId` 与版本作为模拟会话元数据，不将所选 Skill 的名称、版本、内部名称或指令渲染为消息。真实产品必须由服务端隐藏保存并注入上下文。Skill 中心只保留 48px 全局窄图标栏和中央内容；进入 Hermes Session 后恢复 300px 对话上下文栏和右侧 Workspace。

## 状态与存储

默认 Skill 主列表的业务状态固定为：

- `active`：启用，命中分配范围的用户可使用
- `inactive`：已停用，保留版本、范围和文件，但用户不可使用

系统不设置发布前暂存流程。管理列表提供三个轻量状态快捷 Tab，但不增加状态字段列或复杂筛选器。新导入默认进入 `active` 并对全员开放；只有确有需要时才切换到“指定范围”。“全员”和“指定范围”互斥，指定范围内部门与人员取并集。停用保留原分配范围、版本和文件，重新启用后继续生效。

浏览器存储使用 v3 键：

- `localStorage["hitouch-skill-center-v3"]`：Skill、版本和分配范围
- `sessionStorage["hitouch-skill-center-flow-v3"]`：单次使用流程

访问 `index.html?reset=1` 会清除这两个键并重新载入种子数据。

v3 读取时会执行幂等规范化：旧的 `published` 状态迁移为 `active`，旧的 `pending` / `disabled` / `offline` / `deleted` 状态迁移为 `inactive`；旧部门名映射到新的稳定 `deptId`，有效人员映射为稳定 `personId`，旧版本记录补齐来源字段，并清除旧的维护者、最近操作人和操作日志字段。选择全员时会清空部门和人员列表。

## 原型边界

- 部门和人员选项是参照当前企微通讯录维护的静态 mock；原型没有企微 API、组织树、同步状态、自动更新或离职事件接入，也不会在页面上暗示已经打通企微。
- 当前真实 Fleet 大多仍将整个 `/mnt/workspace/shared/skills` 配为 `external_dirs`。正式实现必须按启用状态和范围生成用户有效 Skill 集合，并在变化后使 Skills 快照失效、刷新对应 Gateway；原型只模拟该结果。
- Git 导入仅提供固定仓库、Commit 和 Skill 目录的静态 mock；ZIP 选择仅按文件名模拟类型、`SKILL.md` 校验和元数据解析，没有读取/解压真实 ZIP 或连接 Git 仓库。
- 版本 `checksum` 与 `gitCommit` 是带 `mock` 标识的确定性占位值，不是密码学摘要；Git 导入页面不接触真实凭证。
- “开始对话”只在 sessionStorage 写入一次模拟使用流程并跳转 `session.html`，没有创建或自动发送真实 Hermes Session。该浏览器存储仅用于原型演示，不代表真实产品的隐藏元数据实现。

## 文件职责

| 文件 | 职责 |
| --- | --- |
| `index.html` | HiTouch 工作台和 Skill 中心入口 |
| `skill-center.html` | 卡片墙、搜索筛选、详情、使用流程和同页管理挂载 |
| `session.html` | Hermes Session 与一次使用流程结果 |
| `assets/data.js` | v3 状态、可见性、启停转换和上传 |
| `assets/common.js` | `UI.mountShell`、Lucide 图标、弹窗、抽屉、Toast 和个人 Skill 操作 |
| `assets/skill-admin.js` | 默认 Skill、上传、配置和启停 |
| `assets/base.css` | 48px 全局窄栏、Hermes 300px 上下文栏、无上下文 Skill 布局、卡片墙、表格和弹层样式 |

全局窄栏由 `UI.mountShell()` 运行时统一生成。`showContext:false` 供 Skill 中心移除上下文栏；Hermes 默认保留上下文栏，并按需显示 Workspace。

## 自动化回归

在项目根目录运行：

```bash
node --test "skill-center/prototype/tests/"*.test.mjs
node --check "skill-center/prototype/assets/data.js"
node --check "skill-center/prototype/assets/common.js"
node --check "skill-center/prototype/assets/skill-admin.js"
```

交付前运行生产源码扫描。第一个命令检查过期界面文案，第二个命令使用 Unicode 属性检查全部 emoji：

```bash
stale_pattern='AI 识别说''明|skill\.mark''down|58''px|草''稿'
rg -n "$stale_pattern" \
  "skill-center/prototype" \
  "skill-center/Skill中心原型交接.md" \
  -g '!**/tests/**'

rg --pcre2 -n '[\p{Extended_Pictographic}\p{Regional_Indicator}\x{FE0F}]' \
  "skill-center/prototype" \
  "skill-center/Skill中心原型交接.md" \
  -g '!**/tests/**'
```

两个命令的生产源码结果都必须为零命中。测试目录中的“不出现”守卫不属于生产源码。

全量测试包含 `tests/browser-behavior.test.mjs`，会调用本机 `/Applications/Google Chrome.app` 运行 headless DOM 行为回归；缺少该应用时，这一条会明确失败。

## 浏览器回归

保持本地服务运行，在同一个浏览器会话中：

1. 打开 `index.html?reset=1`，确认工作台数量和 Skill 中心入口。
2. 在 1280x800、1440x900、1920x1080 检查卡片两列/三列、无横向溢出、无重叠，操作位置稳定。
3. 验证全部来源筛选、搜索、空状态、详情返回条件保留和长文本 tooltip。
4. 验证空需求校验和成功创建 Session；Skill 中心无上下文栏和 Workspace，Session 有 300px 上下文栏和 Workspace。
5. 重置后验证个人 Skill 编辑与删除确认。
6. 验证“全部 / 启用中 / 已停用”快捷筛选与搜索叠加、模拟 ZIP 校验、新导入默认全员、全员与指定范围互斥、部门与人员组合、人员姓名搜索、一次确认导入，以及停用/重新启用。
7. 每条路径结束后检查控制台，预期无未捕获错误。
