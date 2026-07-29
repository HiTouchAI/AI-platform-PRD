# HiTouch AI 中台产品需求文档

AI 中台面向 HiTouch 内部，提供 AI 辅助应用制作、发布、发现与使用的统一平台能力。

## 模块

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| [应用中心](./app-center/) | 一期 MVP | HTML 小工具的发布、发现、使用与价值反馈 |
| [Skill 中心](./skill-center/) | 一期需求与原型 | 默认 Skill 分配管理、个人 Skill 使用与 Hermes Session 衔接 |

## 一期范围

应用中心一期 MVP（详见 [`app-center/应用中心一期需求文档.md`](./app-center/应用中心一期需求文档.md)）覆盖：

- 从 Hermes Session 发布 HTML 应用到应用中心
- 应用列表、搜索、详情、在线使用、点赞
- 使用数据统计（使用人数、使用次数、点赞人数）
- 最小运营上架、下架

当前可运行的单页原型位于 [`app-center/prototype/应用中心一期Demo.html`](./app-center/prototype/应用中心一期Demo.html)。

以下能力已拆入二期，不属于当前 MVP：

- 应用中心内新建应用（AI 辅助制作）
- "我发布的"应用管理
- 版本记录、更新与完整运营后台

## Skill 中心一期

Skill 中心一期同时交付使用中心和轻量管理，详见
[`skill-center/Skill中心一期需求文档.md`](./skill-center/Skill中心一期需求文档.md)。

当前模块化原型位于 [`skill-center/prototype/`](./skill-center/prototype/)：

- `index.html`：HiTouch 工作台入口；
- `skill-center.html`：使用中心与默认 Skill 管理；
- `session.html`：使用指定 Skill 后的 Hermes Session；
- `assets/`：共享样式、状态与页面逻辑；
- `tests/`：需求契约、状态逻辑及真实浏览器行为回归。

研发交接与实现边界见
[`skill-center/Skill中心原型交接.md`](./skill-center/Skill中心原型交接.md)。

## 协作方式

- PRD 文档为事实源，以本文档为准
- 需求变更通过 PR 提交，需产品负责人 review
- 技术方案由研发在满足验收标准的前提下自主决定
