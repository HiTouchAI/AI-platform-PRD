# HiTouch Skill 中心一期原型交接

## 当前口径

- 产品需求：`Skill中心/Skill中心一期需求文档.md`
- 交付目录：`skill-center/prototype/`
- 兼容入口：`skill-center/Skill中心一期Demo.html`
- 交互视口：1280x800、1440x900、1920x1080

一期同时交付使用中心和轻量管理，原因是当前没有其他可供业务人员配置默认 Skill 范围的入口。范围控制是使用中心正确展示和 Hermes 正确加载的前置依赖。

管理保持轻量：

- 新导入默认全员，可按需切换到指定范围；两种模式互斥。
- 指定范围内部门和人员可共存并取并集，人员支持按姓名搜索。
- 不设置发布前暂存、审核或审批。
- 不记录维护者、最近操作人或操作日志。
- 主列表提供“全部 / 启用中 / 已停用”快捷 Tab，并与搜索叠加生效。
- 主列表只有已停用项显示弱状态提示。
- 不提供默认 Skill 删除、更多菜单或回收站。

## 运行

```bash
python3 -m http.server 4173 --directory "skill-center/prototype"
```

入口：

| 场景 | URL |
| --- | --- |
| 重置并进入工作台 | `http://127.0.0.1:4173/index.html?reset=1` |
| 使用中心 | `http://127.0.0.1:4173/skill-center.html` |
| 默认 Skill 管理 | `http://127.0.0.1:4173/skill-center.html?mode=manage` |
| Hermes Session | `http://127.0.0.1:4173/session.html` |

## 使用中心

- 展示当前用户有效的默认 Skill 与本人个人 Skill。
- 支持全部、默认、我创建的筛选和关键词搜索。
- 卡片主体进入详情，使用按钮打开需求输入。
- 指定 Skill 通过隐藏元数据创建模拟 Session。
- 个人 Skill 可编辑展示名称和作用，也可二次确认后删除。
- 卡片和详情不展示 Skill 描述、文件清单或文件内容。

Skill 中心只保留 48px 全局窄栏和主内容区。进入 Hermes Session 后恢复 300px 对话上下文栏和 Workspace。

## 默认 Skill 管理

- 管理与使用中心同页切换，不存在独立 `admin.html`。
- 管理入口直接展示默认 Skill，不再提供子导航。
- 支持“全部 / 启用中 / 已停用”快捷筛选，并与关键词搜索组合使用。
- 支持固定 Git 仓库导入或 ZIP 上传。
- 新导入默认全员，一次确认后立即可用。
- “全员 / 指定范围”互斥；指定范围内可组合部门和人员。
- 人员选择支持姓名搜索，并展示所属部门。
- 支持展示名称、作用、范围编辑和内容更新。
- 支持停用和重新启用。
- 更新保留原范围和启用状态。
- 版本记录保留来源、校验值、Git Commit 和更新说明。

## 状态与兼容

| 状态 | 用户可见 | 新 Session 加载 |
| --- | --- | --- |
| `active` | 按分配范围 | 按分配范围 |
| `inactive` | 否 | 否 |

- 旧 `published` 迁移为 `active`。
- 旧 `pending` / `disabled` / `offline` / `deleted` 迁移为 `inactive`。
- 停用和范围变更只影响新 Session，历史 Session 不变。

## 加载约束

`/mnt/workspace/shared/skills` 只代表文件存储，不代表某个用户的加载集合。

- 使用中心与新 Session 的有效集合必须一致。
- 后端按用户、启用状态和范围生成有效 Skill 集合。
- 不得把整个 shared Skills 根目录直接交给每个用户加载。
- 集合变化后必须使 Skills 快照失效并刷新对应 Gateway。
- `selected_skill_id` 和版本快照属于隐藏会话元数据，不渲染为聊天消息。

## Mock 边界

- 部门和人员是参照当前企微通讯录维护的静态样例；没有企微 API、组织同步或自动更新。
- 页面不展示同步状态和最近同步时间。
- ZIP 校验只按文件名和模拟元数据判断，不读取真实 ZIP。
- Git Commit 和 checksum 是带 `mock` 标识的占位值。
- 创建 Session 只写浏览器 sessionStorage，不调用 Hermes 后端。
- 原型固定展示最高权限账号视角；真实产品必须校验 `skills` 权限。

## 验证

```bash
node --test "skill-center/prototype/tests/"*.test.mjs
node --check "skill-center/prototype/assets/data.js"
node --check "skill-center/prototype/assets/common.js"
node --check "skill-center/prototype/assets/skill-admin.js"
```

浏览器回归重点：

1. 使用中心筛选、搜索、详情、使用和个人 Skill 操作。
2. 管理列表状态快捷 Tab、与搜索组合、筛选状态在重绘后保留、默认全员、范围模式互斥、部门与人员组合、人员搜索、停用和重新启用。
3. 默认 Skill 管理不存在删除、更多菜单和回收站。
4. 三个目标视口无重叠和横向溢出。
5. 控制台无未捕获错误。
