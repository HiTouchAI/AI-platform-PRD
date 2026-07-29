import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const admin = readFileSync(new URL("assets/skill-admin.js", root), "utf8");
const data = readFileSync(new URL("assets/data.js", root), "utf8");
const common = readFileSync(new URL("assets/common.js", root), "utf8");
const css = readFileSync(new URL("assets/base.css", root), "utf8");

test("management uses lightweight status tabs without a status column", () => {
  for (const [value, label] of [["all", "全部"], ["active", "启用中"], ["inactive", "已停用"]]) {
    assert.match(admin, new RegExp(`statusFilterTab\\("${value}", "${label}"\\)`));
  }
  assert.match(admin, /var currentStatus = "all"/);
  assert.match(admin, /currentStatus !== "all" && skill\.status !== currentStatus/);
  assert.doesNotMatch(admin, /var FILTERS|FILTER_LABELS|<select[^>]+status/i);
  assert.doesNotMatch(admin, /<th>状态<\/th>/);
  assert.match(admin, /skill\.status === "inactive"[\s\S]*?已停用/);
  assert.doesNotMatch(admin, /stats-row|statCard\(/);
});

test("status tabs and keyword search are combined", () => {
  assert.match(admin, /var needle = currentQuery\.toLowerCase\(\)/);
  assert.match(admin, /currentStatus !== "all" && skill\.status !== currentStatus/);
  assert.match(admin, /if \(!needle\) return true/);
  assert.match(admin, /\[skill\.displayName, skill\.internalName, skill\.purpose\]/);
});

test("row actions only keep edit, versions, and availability changes", () => {
  assert.match(admin, /data-row-action="edit"/);
  assert.match(admin, /skill\.status === "active" \? "deactivate" : "activate"/);
  assert.match(admin, /class="admin-version-link"[\s\S]*?data-row-action="versions"/);
  assert.doesNotMatch(admin, /data-row-action="delete"|更多操作|action-menu/);
});

test("management list is a dense table without a secondary action menu", () => {
  for (const label of ["展示名称和内部名称", "作用", "版本", "分配范围", "更新时间", "操作"]) {
    assert.match(admin, new RegExp(label));
  }
  assert.doesNotMatch(admin, /维护者|最近操作人/);
  assert.match(css, /\.admin-table/);
  assert.doesNotMatch(css, /\.action-menu/);
});

test("all state actions use transitionDefault and never updateDefault status", () => {
  assert.match(admin, /S\.transitionDefault\(skillId, action\)/);
  assert.doesNotMatch(admin, /S\.updateDefault\([^)]*status/s);
  assert.doesNotMatch(admin, /S\.softDelete\(/);
});

test("import is a three-step drawer with one default-active confirmation", () => {
  assert.match(admin, /UI\.openDrawer/);
  assert.match(admin, /data-step="1"/);
  assert.match(admin, /data-step="3"/);
  assert.doesNotMatch(admin, /校验结果/);
  assert.match(admin, /默认对全员开放/);
  assert.match(admin, /确认" \+ verb \+ \(wizard\.assignAll \? "并对全员开放" : "并开放给指定范围"\)/);
  assert.doesNotMatch(admin, /保存为未发布|确认发布|data-wizard-action="pending"|data-wizard-action="publish"/);
  assert.match(admin, /仅支持 ZIP 文件/);
  assert.match(admin, /未找到有效的 SKILL\.md/);
  assert.match(admin, /function canSubmitUpload/);
  assert.match(admin, /assignAll: true/);
});

test("assignment changes refresh the upload completion availability", () => {
  const bindWizard = admin.match(/function bindWizard\(drawer, wizard\) \{([\s\S]*?)\n    \}\n\n    function validateZip/)?.[1] || "";
  assert.match(admin, /function syncWizardActions/);
  assert.match(bindWizard, /bindAssignment\(drawer, function \(\) \{[\s\S]*?syncWizardActions\(drawer, wizard\)/);
});

test("edit centralizes metadata, content update, and version entry points", () => {
  const edit = admin.match(/function openEditDrawer\(skillId[\s\S]*?\n    \}/)?.[0] || "";
  assert.match(edit, /displayName/);
  assert.match(edit, /purpose/);
  assert.match(edit, /assignmentEditor/);
  assert.match(admin, /data-edit-action="versions"/);
  assert.match(admin, /data-edit-action="replace"/);
  assert.match(admin, /内容与版本/);
  assert.match(admin, /function openReplaceDrawer/);
  assert.match(admin, /更新说明/);
  assert.match(admin, /replaceId:/);
  assert.match(admin, /function openVersionsDrawer/);
  assert.match(admin, /版本记录（只读）/);
});

test("editing any default Skill cannot clear every assignment", () => {
  const edit = admin.match(/function openEditDrawer\(skillId[\s\S]*?\n    \}/)?.[0] || "";
  assert.match(edit, /至少选择一种分配范围/);
  assert.doesNotMatch(edit, /skill\.status ===/);
});

test("admin UI uses Lucide icons and contains no emoji or inline style", () => {
  assert.match(admin, /UI\.icon\("upload"/);
  assert.doesNotMatch(admin, /📦|✓|＋|📚/);
  assert.doesNotMatch(admin, /style="/);
});

test("upload click passes currentTarget and common only restores connected Element focus", () => {
  assert.match(
    admin,
    /#admin-upload"\)\.addEventListener\("click", function \(event\) \{\s*openUploadDrawer\(event\.currentTarget\);\s*\}\)/
  );
  assert.doesNotMatch(admin, /addEventListener\("click", openUploadDrawer\)/);
  assert.match(common, /function isConnectedElement/);
  assert.match(common, /nodeType === 1/);
  assert.match(common, /\.isConnected === true/);
  assert.match(common, /if \(isConnectedElement\(layer\._returnFocus\)\) layer\._returnFocus\.focus\(\)/);
});

test("upload has one completion gate and no early draft save", () => {
  const submitRule = admin.match(/function canSubmitUpload\(wizard\) \{([\s\S]*?)\n    \}/)?.[1] || "";
  assert.match(submitRule, /wizard\.validZip/);
  assert.match(submitRule, /wizard\.internalName/);
  assert.match(submitRule, /wizard\.description/);
  assert.match(submitRule, /wizard\.displayName/);
  assert.match(submitRule, /wizard\.purpose/);
  assert.match(submitRule, /assignAll|assignDepts|assignPeople/);
  assert.doesNotMatch(admin, /canSavePending|canPublish|publish:\s*publish/);
});

test("state changes return focus to the direct row action", () => {
  assert.match(admin, /container\.querySelectorAll\("\.admin-state-action"\)/);
  assert.match(admin, /runAction\(actionTrigger\.dataset\.id, actionTrigger\.dataset\.rowAction, actionTrigger\)/);
});

test("active and inactive rows offer lightweight availability actions", () => {
  assert.match(admin, /skill\.status === "active" \? "deactivate" : "activate"/);
  assert.match(admin, /deactivate:\s*\{[\s\S]*?Skill 已停用/);
  assert.match(admin, /activate:\s*\{[\s\S]*?Skill 已重新启用/);
  assert.doesNotMatch(admin, /lastOperator|maintainer/);
});

test("assignment modes make all users exclusive while custom scope combines departments and searchable people", () => {
  assert.match(admin, /type="radio" id="scope-all" name="scope-mode" value="all"/);
  assert.match(admin, /type="radio" id="scope-custom" name="scope-mode" value="custom"/);
  assert.match(admin, /部门和指定人员可以同时选择，最终范围取并集/);
  assert.match(admin, /id="scope-person-search" type="search" placeholder="搜索人员姓名"/);
  assert.match(admin, /chip\.dataset\.personName\.indexOf\(query\)/);
  assert.match(admin, /department \? department\.name : "部门未配置"/);
  assert.match(admin, /if \(all && all\.checked\) return \{ all: true, depts: \[\], people: \[\] \}/);
});

test("management does not imply a WeCom organization sync", () => {
  assert.doesNotMatch(admin, /组织同步|最近同步|同步正常|ORG_SYNC/);
  assert.doesNotMatch(data, /var ORG_SYNC|ORG_SYNC:/);
  assert.doesNotMatch(css, /\.org-sync-status/);
});

test("invalid selected files never use the success file appearance", () => {
  assert.match(admin, /wizard\.validZip \? "valid-file" : "invalid-file"/);
  assert.match(admin, /wizard\.validZip \? "file-check-2" : "file-x"/);
  assert.match(css, /\.selected-file\.invalid-file/);
});

test("default management removes deletion and recycle-bin flows", () => {
  assert.doesNotMatch(admin, /默认 Skill 回收站|回收站|openRestoreDialog|restoreSkill|data-recycle-action/);
  assert.doesNotMatch(data, /function softDelete|function restoreSkill|softDelete:|restoreSkill:/);
  assert.doesNotMatch(css, /\.admin-subnav/);
});

test("management removes maintainer attribution and the operation log module", () => {
  assert.doesNotMatch(admin, /操作日志|renderLogs|drawLogRows|data-nav="logs"/);
  assert.doesNotMatch(data, /maintainer:|lastOperator:|logs:|who:/);
  assert.match(data, /delete state\.logs/);
  assert.match(data, /delete skill\.maintainer/);
  assert.match(data, /delete skill\.lastOperator/);
  assert.match(data, /delete normalized\.who/);
});
