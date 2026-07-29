import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

function storage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

function loadSkillState() {
  const context = {
    localStorage: storage(),
    sessionStorage: storage(),
    location: { search: "" },
    window: {},
    URLSearchParams,
    Date,
    JSON,
    Math
  };
  context.window.window = context.window;
  vm.runInContext(
    readFileSync(new URL("../assets/data.js", import.meta.url), "utf8"),
    vm.createContext(context)
  );
  return {
    ...context.window.S,
    getEffectiveSkillIds() {
      return Array.from(context.window.S.getEffectiveSkillIds());
    }
  };
}

test("only personal and assigned active skills enter the effective set", () => {
  const S = loadSkillState();
  const ids = S.getEffectiveSkillIds();
  assert.deepEqual(ids.sort(), [
    "bookkeeping",
    "dws",
    "personal-meeting",
    "personal-research"
  ]);
});

test("default skill state machine rejects invalid transitions", () => {
  const S = loadSkillState();
  assert.equal(S.transitionDefault("onboarding", "deactivate"), null);
  assert.equal(S.transitionDefault("onboarding", "activate").status, "active");
  assert.equal(S.transitionDefault("onboarding", "deactivate").status, "inactive");
  assert.equal(S.transitionDefault("onboarding", "review"), null);
  assert.equal(S.transitionDefault("onboarding", "delete"), null);
});

test("updateDefault only changes display metadata and assignment scope", () => {
  const S = loadSkillState();
  assert.equal(S.updateDefault("onboarding", { status: "draft" }), null);
  assert.equal(S.getSkill("onboarding").status, "inactive");

  assert.equal(S.updateDefault("onboarding", { status: "active" }), null);
  assert.equal(S.getSkill("onboarding").status, "inactive");

  assert.equal(S.updateDefault("onboarding", { origin: "personal" }), null);
  assert.equal(S.getSkill("onboarding").origin, "default");

  assert.equal(S.updateDefault("onboarding", { id: "renamed-id" }), null);
  assert.equal(S.getSkill("onboarding").id, "onboarding");

  assert.equal(S.updateDefault("onboarding", { internalName: "other-command" }), null);
  assert.equal(S.getSkill("onboarding").internalName, "fleet-user-onboarding");

  assert.equal(S.updateDefault("onboarding", { version: "99" }), null);
  assert.equal(S.getSkill("onboarding").version, "1");

  assert.equal(S.updateDefault("onboarding", { description: "other file content" }), null);
  assert.equal(S.getSkill("onboarding").description, "管理员为新员工创建 HiTouch 与 Hermes 环境时使用。");

  assert.equal(
    S.updateDefault("onboarding", {
      displayName: "新版入职助手",
      purpose: "协调新同事的入职准备。",
      assignAll: true,
      assignDepts: [],
      assignPeople: []
    }).displayName,
    "新版入职助手"
  );
  assert.deepEqual(
    {
      displayName: S.getSkill("onboarding").displayName,
      purpose: S.getSkill("onboarding").purpose,
      assignAll: S.getSkill("onboarding").assignAll,
      assignDepts: Array.from(S.getSkill("onboarding").assignDepts),
      assignPeople: Array.from(S.getSkill("onboarding").assignPeople)
    },
    {
      displayName: "新版入职助手",
      purpose: "协调新同事的入职准备。",
      assignAll: true,
      assignDepts: [],
      assignPeople: []
    }
  );
});

test("active and inactive metadata edits cannot remove the complete assignment scope", () => {
  const S = loadSkillState();
  const before = S.getSkill("bookkeeping");
  assert.equal(S.updateDefault("bookkeeping", {
    displayName: before.displayName,
    purpose: before.purpose,
    assignAll: false,
    assignDepts: [],
    assignPeople: []
  }), null);
  assert.deepEqual(Array.from(S.getSkill("bookkeeping").assignDepts), ["dept-finance", "dept-market"]);

  const inactive = S.getSkill("onboarding");
  assert.equal(S.updateDefault("onboarding", {
    displayName: inactive.displayName,
    purpose: inactive.purpose,
    assignAll: false,
    assignDepts: [],
    assignPeople: []
  }), null);
  assert.match(S.assignmentSummary(S.getSkill("onboarding")), /AI 技术部/);
});

test("v3 storage keys and seed objects exclude client-only content and visibility flags", () => {
  const S = loadSkillState();
  assert.equal(S.STORAGE_KEY, "hitouch-skill-center-v3");
  assert.equal(S.FLOW_KEY, "hitouch-skill-center-flow-v3");

  for (const skill of S.loadState().skills) {
    assert.equal(Object.hasOwn(skill, "markdown"), false);
    assert.equal(Object.hasOwn(skill, "visibleToUser"), false);
  }

  const uploaded = S.uploadSkill({
    fileName: "uploaded-skill.zip",
    validZip: true,
    internalName: "uploaded-skill",
    description: "上传解析出的说明。",
    displayName: "上传的 Skill",
    purpose: "检查上传对象不包含文件内容。",
    assignAll: true
  });
  assert.equal(Object.hasOwn(uploaded, "markdown"), false);
});

test("visible skills derive from active status and current assignment, not persisted visibility", () => {
  const S = loadSkillState();
  const state = S.loadState();
  const bookkeeping = state.skills.find((skill) => skill.id === "bookkeeping");
  bookkeeping.visibleToUser = false;
  S.saveState(state);

  assert.equal(Object.hasOwn(S.getSkill("bookkeeping"), "visibleToUser"), false);
  assert.deepEqual(
    Array.from(S.visibleSkills(), (skill) => skill.id).sort(),
    ["bookkeeping", "dws", "personal-meeting", "personal-research"]
  );
});

test("whitespace-only requests never create a flow", () => {
  const S = loadSkillState();
  assert.equal(S.createFlow("dws", "   \n\t "), null);
  assert.equal(S.getFlow(), null);
});

test("deleting one personal Skill preserves every other Skill", () => {
  const S = loadSkillState();
  const beforeIds = Array.from(S.loadState().skills, (skill) => skill.id);

  assert.equal(S.deletePersonal("personal-meeting"), true);

  const afterIds = Array.from(S.loadState().skills, (skill) => skill.id);
  assert.equal(S.getSkill("personal-meeting"), null);
  assert.deepEqual(afterIds, beforeIds.filter((id) => id !== "personal-meeting"));
  assert.notEqual(S.getSkill("personal-research"), null);
  assert.notEqual(S.getSkill("dws"), null);
});

test("manual personal purpose edits invalidate an older pending generation", () => {
  const S = loadSkillState();
  const skillId = "personal-research";
  const pendingPurpose = S.getSkill(skillId).pendingPurpose;
  const manualPurpose = "手工填写的新用途，不能被后台生成覆盖。";

  assert.ok(S.editPersonal(skillId, "客户调研助手", manualPurpose));
  assert.equal(Object.hasOwn(S.getSkill(skillId), "pendingPurpose"), false);
  assert.equal(S.completePurpose(skillId, pendingPurpose), null);
  assert.equal(S.getSkill(skillId).purpose, manualPurpose);
});

test("purpose completion only accepts the currently pending generation request", () => {
  const S = loadSkillState();
  const skillId = "personal-research";
  const staleRequest = S.getSkill(skillId).pendingPurpose;
  const currentRequest = "更新后的用途生成请求。";
  const state = S.loadState();
  state.skills.find((skill) => skill.id === skillId).pendingPurpose = currentRequest;
  S.saveState(state);

  assert.equal(S.completePurpose(skillId, staleRequest), null);
  assert.equal(S.getSkill(skillId).pendingPurpose, currentRequest);
  assert.equal(S.completePurpose(skillId, currentRequest).purpose, currentRequest);
});

test("new uploads default to full-scope active and reject an empty custom scope", () => {
  const S = loadSkillState();
  const uploaded = S.uploadSkill({
    fileName: "review.zip",
    validZip: true,
    internalName: "review-skill",
    description: "检查资料。",
    displayName: "资料检查",
    purpose: "检查提交资料是否齐全。"
  });

  assert.equal(uploaded.status, "active");
  assert.equal(uploaded.assignAll, true);
  assert.equal(S.assignmentSummary(uploaded), "全员");
  assert.equal(S.uploadSkill({
    fileName: "invalid-scope.zip",
    validZip: true,
    internalName: "invalid-scope",
    description: "缺少范围。",
    displayName: "非法范围",
    purpose: "没有配置范围。",
    assignAll: false,
    assignDepts: [],
    assignPeople: []
  }), null);
});

test("upload rejects invalid ZIP metadata and preserves parsed Skill metadata", () => {
  const S = loadSkillState();
  assert.equal(S.uploadSkill({}), null);
  assert.equal(S.uploadSkill({
    fileName: "empty.zip",
    validZip: true,
    internalName: "",
    description: "有效描述"
  }), null);
  assert.equal(S.uploadSkill({
    fileName: "empty.zip",
    validZip: true,
    internalName: "empty",
    description: "   "
  }), null);
  assert.equal(S.uploadSkill({
    fileName: "looks-valid.zip",
    internalName: "looks-valid",
    description: "不能省略显式 ZIP 校验结果。"
  }), null);
  assert.equal(S.uploadSkill({ fileName: "skill.txt", validZip: false }), null);

  const uploaded = S.uploadSkill({
    fileName: "invoice-review.zip",
    validZip: true,
    internalName: "invoice-review",
    description: "来自 SKILL.md 的说明。",
    displayName: "票据复核",
    purpose: "复核票据字段。"
  });
  assert.equal(uploaded.internalName, "invoice-review");
  assert.equal(uploaded.description, "来自 SKILL.md 的说明。");
});

test("upload requires complete metadata and a valid scope before becoming active", () => {
  const S = loadSkillState();
  assert.equal(S.uploadSkill({
    fileName: "parsed-only.zip",
    validZip: true,
    internalName: "  parsed-only  ",
    description: "  解析出的说明。  ",
    displayName: "   ",
    purpose: "",
    assignAll: false,
    assignDepts: ["不存在部门"],
    assignPeople: ["新同事"]
  }), null);

  assert.equal(S.uploadSkill({
    fileName: "bad-display.zip",
    validZip: true,
    internalName: "bad-display",
    description: "有效描述",
    displayName: "  ",
    purpose: "用途",
    assignAll: true
  }), null);
  assert.equal(S.uploadSkill({
    fileName: "bad-scope.zip",
    validZip: true,
    internalName: "bad-scope",
    description: "有效描述",
    displayName: "非法范围",
    purpose: "不能依赖不存在的组织对象。",
    assignAll: false,
    assignDepts: ["不存在部门"],
    assignPeople: ["新同事"]
  }), null);
});

test("usable invariant is shared by upload, update, and activation", () => {
  const S = loadSkillState();
  const before = S.getSkill("bookkeeping");

  assert.equal(S.updateDefault("bookkeeping", {
    displayName: "   ",
    purpose: before.purpose,
    assignAll: true,
    assignDepts: [],
    assignPeople: []
  }), null);
  assert.equal(S.updateDefault("bookkeeping", {
    displayName: before.displayName,
    purpose: " \n ",
    assignAll: true,
    assignDepts: [],
    assignPeople: []
  }), null);
  assert.equal(S.updateDefault("bookkeeping", {
    displayName: before.displayName,
    purpose: before.purpose,
    assignAll: false,
    assignDepts: ["不存在部门"],
    assignPeople: ["新同事"]
  }), null);
  assert.equal(S.getSkill("bookkeeping").displayName, before.displayName);

  const normalized = S.updateDefault("bookkeeping", {
    displayName: "  代理记账报价  ",
    purpose: "  生成报价建议。  ",
    assignAll: false,
    assignDepts: ["销售部", "不存在部门"],
    assignPeople: ["Rita", "新同事"]
  });
  assert.equal(normalized.displayName, "代理记账报价");
  assert.equal(normalized.purpose, "生成报价建议。");
  assert.deepEqual(Array.from(normalized.assignDepts), ["dept-market"]);
  assert.deepEqual(Array.from(normalized.assignPeople), ["person-rita"]);

  const state = S.loadState();
  const onboarding = state.skills.find((skill) => skill.id === "onboarding");
  onboarding.displayName = "  ";
  onboarding.assignAll = true;
  S.saveState(state);
  assert.equal(S.transitionDefault("onboarding", "activate"), null);
  assert.equal(S.getSkill("onboarding").status, "inactive");
});

test("static directory assignments use stable IDs and combine departments with people", () => {
  const S = loadSkillState();
  assert.ok(S.DEPTS.every(department =>
    department.id && department.name &&
    Object.hasOwn(department, "parentId")
  ));
  assert.ok(S.PEOPLE.every(person =>
    person.personId && person.deptId &&
    Object.hasOwn(person, "hitouchUserId")
  ));

  const byDepartmentAndPerson = S.uploadSkill({
    fileName: "product-guidance.zip",
    validZip: true,
    internalName: "product-guidance",
    description: "产品部门工作指引。",
    displayName: "产品工作指引",
    purpose: "验证部门和人员组合授权。",
    assignAll: false,
    assignDepts: ["dept-product"],
    assignPeople: ["person-jimmy"]
  });
  assert.deepEqual(Array.from(byDepartmentAndPerson.assignDepts), ["dept-product"]);
  assert.deepEqual(Array.from(byDepartmentAndPerson.assignPeople), ["person-jimmy"]);
  assert.equal(S.isVisible(byDepartmentAndPerson.id), true);
  assert.equal(S.assignmentSummary(byDepartmentAndPerson), "产品部、李天智 Jimmy");

  const byPerson = S.uploadSkill({
    fileName: "rita-only.zip",
    validZip: true,
    internalName: "rita-only",
    description: "指定人员授权。",
    displayName: "Rita 专用",
    purpose: "验证稳定人员 ID 授权。",
    assignAll: false,
    assignDepts: [],
    assignPeople: ["person-rita"]
  });
  assert.deepEqual(Array.from(byPerson.assignPeople), ["person-rita"]);
  assert.equal(S.isVisible(byPerson.id), true);

  assert.equal(S.uploadSkill({
    fileName: "unknown-person-only.zip",
    validZip: true,
    internalName: "unknown-person-only",
    description: "未知人员不应获得权限。",
    displayName: "未知人员专用",
    purpose: "验证未知人员不能授权。",
    assignAll: false,
    assignDepts: [],
    assignPeople: ["person-unknown"]
  }), null);
});

test("v3 state normalization migrates legacy department and person names to IDs", () => {
  const S = loadSkillState();
  const state = S.loadState();
  const onboarding = state.skills.find(skill => skill.id === "onboarding");
  state.user = { id: "rita", name: "Rita", dept: "平台组" };
  onboarding.assignDepts = ["产品部"];
  onboarding.assignPeople = ["Rita", "新同事"];
  onboarding.status = "disabled";
  S.saveState(state);

  const migrated = S.loadState();
  const migratedOnboarding = migrated.skills.find(skill => skill.id === "onboarding");
  assert.equal(migrated.user.personId, "person-rita");
  assert.equal(migrated.user.deptId, "dept-product");
  assert.equal(Object.hasOwn(migrated.user, "dept"), false);
  assert.deepEqual(Array.from(migratedOnboarding.assignDepts), ["dept-product"]);
  assert.deepEqual(Array.from(migratedOnboarding.assignPeople), ["person-rita"]);
  assert.equal(migratedOnboarding.status, "inactive");
});

test("department options mirror the current static directory without sync metadata", () => {
  const S = loadSkillState();
  assert.deepEqual(Array.from(S.DEPTS, department => department.name), [
    "总部业务部", "深圳公司", "印尼公司", "产品部", "运营组", "财务部", "市场部",
    "人力资源部", "行政部", "IT 部", "AI 产品部", "AI 技术部", "其他"
  ]);
  assert.equal(Object.hasOwn(S, "ORG_SYNC"), false);
});

test("effective internal names are stable, while use flows bind immutable selected Skill metadata", () => {
  const S = loadSkillState();
  const upload = (label) => S.uploadSkill({
    fileName: `${label}.zip`,
    validZip: true,
    internalName: "  dws  ",
    description: `解析说明 ${label}`,
    displayName: `冲突 Skill ${label}`,
    purpose: "验证有效命令名。",
    assignAll: true
  });

  const first = upload("first");
  const second = upload("second");
  const third = upload("third");
  assert.equal(first.internalName, "dws");
  assert.equal(first.effectiveInternalName, "dws-1");
  assert.equal(second.effectiveInternalName, "dws-2");
  assert.equal(third.effectiveInternalName, "dws-3");

  const firstFlow = S.createFlow(first.id, "执行任务");
  const secondFlow = S.createFlow(second.id, "执行任务");
  assert.equal(firstFlow.selectedSkillId, first.id);
  assert.equal(secondFlow.selectedSkillId, second.id);
  assert.equal(firstFlow.selectedSkillVersion, "v1");
  assert.equal(Object.hasOwn(firstFlow, "internalName"), false);
  assert.equal(S.getSkill(first.id).effectiveInternalName, "dws-1");
});

test("replacement requires parsed ZIP metadata and cannot introduce an effective-name conflict", () => {
  const S = loadSkillState();
  assert.equal(S.uploadSkill({
    replaceId: "contract",
    updateNote: "无 ZIP 不应追加版本"
  }), null);
  assert.equal(S.uploadSkill({
    replaceId: "contract",
    fileName: "contract.zip",
    validZip: true,
    internalName: "",
    description: "有效描述",
    updateNote: "缺少内部名"
  }), null);

  const replaced = S.uploadSkill({
    replaceId: "contract",
    fileName: "dws.zip",
    validZip: true,
    internalName: "dws",
    description: "改用冲突的解析名称。",
    updateNote: "切换命令名"
  });
  assert.equal(replaced.internalName, "dws");
  assert.equal(replaced.effectiveInternalName, "dws-1");
  assert.notEqual(replaced.effectiveInternalName, S.getSkill("dws").internalName);
});

test("replacement preserves an existing effective command when its parsed internal name is unchanged", () => {
  const S = loadSkillState();
  const uploaded = S.uploadSkill({
    fileName: "dws-extension.zip",
    validZip: true,
    internalName: "dws",
    description: "扩展说明。",
    displayName: "钉钉扩展",
    purpose: "验证稳定命令。",
    assignAll: true
  });
  assert.equal(uploaded.effectiveInternalName, "dws-1");
  assert.ok(S.transitionDefault("dws", "deactivate"));

  const replaced = S.uploadSkill({
    replaceId: uploaded.id,
    fileName: "dws-extension-v2.zip",
    validZip: true,
    internalName: "dws",
    description: "扩展说明第二版。",
    updateNote: "内容更新"
  });
  assert.equal(replaced.effectiveInternalName, "dws-1");
  assert.equal(S.createFlow(replaced.id, "执行扩展").selectedSkillId, replaced.id);
});

test("inactive names stay reserved across same-name upload and reactivation", () => {
  const S = loadSkillState();
  assert.ok(S.transitionDefault("dws", "deactivate"));

  const uploaded = S.uploadSkill({
    fileName: "dws-successor.zip",
    validZip: true,
    internalName: "dws",
    description: "同名后继 Skill。",
    displayName: "钉钉办公助手后继版",
    purpose: "验证停用与重新启用之间的命令名稳定性。",
    assignAll: true
  });
  assert.equal(uploaded.effectiveInternalName, "dws-1");
  assert.equal(S.createFlow(uploaded.id, "后继任务").selectedSkillId, uploaded.id);

  assert.ok(S.transitionDefault("dws", "activate"));

  const originalFlow = S.createFlow("dws", "原 Skill 任务");
  const successorFlow = S.createFlow(uploaded.id, "后继任务");
  assert.equal(originalFlow.selectedSkillId, "dws");
  assert.equal(successorFlow.selectedSkillId, uploaded.id);
  assert.notEqual(originalFlow.selectedSkillId, successorFlow.selectedSkillId);
  assert.equal(S.getSkill(uploaded.id).effectiveInternalName, "dws-1");
});

test("replacement creates a new system version with the supplied update note", () => {
  const S = loadSkillState();
  const before = S.getSkill("contract");
  const replaced = S.uploadSkill({
    replaceId: "contract",
    fileName: "contract-risk-review.zip",
    validZip: true,
    internalName: "contract-risk-review",
    description: "更新后的 SKILL.md 说明。",
    updateNote: "补充付款条款检查"
  });

  assert.equal(replaced.version, String(Number(before.version) + 1));
  assert.equal(replaced.status, "inactive");
  assert.equal(replaced.description, "更新后的 SKILL.md 说明。");
  assert.equal(replaced.versions[0].note, "补充付款条款检查");
  assert.equal(replaced.versions[0].current, true);
  assert.equal(replaced.versions[1].current, false);
});

test("version records carry ZIP, checksum, and git commit audit fields", () => {
  const S = loadSkillState();
  for (const skill of S.loadState().skills.filter(item => item.origin === "default")) {
    for (const version of skill.versions) {
      assert.ok(version.zipFile);
      assert.match(version.checksum, /^sha256:/);
      assert.ok(version.gitCommit);
    }
  }

  const replaced = S.uploadSkill({
    replaceId: "contract",
    fileName: "contract-risk-review-v5.zip",
    validZip: true,
    internalName: "contract-risk-review",
    description: "更新后的合同检查说明。",
    updateNote: "补充履约期限检查"
  });
  assert.equal(replaced.versions[0].zipFile, "contract-risk-review-v5.zip");
  assert.match(replaced.versions[0].checksum, /^sha256:/);
  assert.match(replaced.versions[0].gitCommit, /^mock\//);
});

test("lightweight state strips legacy maintainer and operation-log fields", () => {
  const S = loadSkillState();
  const state = S.loadState();
  state.logs = [{ action: "发布" }];
  state.skills[0].maintainer = "旧维护者";
  state.skills[0].lastOperator = "旧操作人";
  state.skills[0].versions[0].who = "旧操作人";
  S.saveState(state);

  const migrated = S.loadState();
  assert.equal(Object.hasOwn(migrated, "logs"), false);
  assert.equal(Object.hasOwn(migrated.skills[0], "maintainer"), false);
  assert.equal(Object.hasOwn(migrated.skills[0], "lastOperator"), false);
  assert.equal(Object.hasOwn(migrated.skills[0].versions[0], "who"), false);
});
