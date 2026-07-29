import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const requirement = readFileSync(
  new URL("../../Skill中心一期需求文档.md", import.meta.url),
  "utf8"
);

test("使用视图不展示 Skill 文件内容", () => {
  assert.match(requirement, /卡片和详情均不展示 Skill 描述、完整 `SKILL\.md`/);
  assert.doesNotMatch(requirement, /进入详情后展示“AI 识别说明”/);
});

test("external_dirs 必须来自权限过滤后的有效集合", () => {
  assert.match(requirement, /不得继续无条件加载整个 shared Skills 根目录/);
  assert.match(requirement, /已停用或未命中分配范围/);
  assert.match(requirement, /\.skills_prompt_snapshot\.json/);
  assert.match(requirement, /刷新对应 Gateway/);
});

test("管理列表提供轻量启用状态快捷筛选", () => {
  assert.match(requirement, /“全部 \/ 启用中 \/ 已停用”三个快捷 Tab/);
  assert.match(requirement, /快捷 Tab 与关键词搜索叠加生效/);
  assert.match(requirement, /不提供状态列或复杂筛选器/);
});

test("指定使用的 Skill 通过隐藏元数据注入，而非斜杠消息", () => {
  assert.match(requirement, /selected_skill_id/);
  assert.match(requirement, /原始需求/);
  assert.match(requirement, /会话历史接口不得返回隐藏上下文全文/);
  assert.doesNotMatch(requirement, /拼接 `\/<有效 Skill 内部名称>`/);
});
