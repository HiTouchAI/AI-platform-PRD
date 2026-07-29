/* ========================================
   Skill Center Demo Data Layer
   ======================================== */
(function () {
  "use strict";

  var STORAGE_KEY = "hitouch-skill-center-v3";
  var FLOW_KEY = "hitouch-skill-center-flow-v3";

  // ── Static department and people directory (mock) ───
  var DEPTS = [
    { id: "dept-head-business", name: "总部业务部", parentId: null },
    { id: "dept-shenzhen", name: "深圳公司", parentId: null },
    { id: "dept-indonesia", name: "印尼公司", parentId: null },
    { id: "dept-product", name: "产品部", parentId: null },
    { id: "dept-operations", name: "运营组", parentId: null },
    { id: "dept-finance", name: "财务部", parentId: null },
    { id: "dept-market", name: "市场部", parentId: null },
    { id: "dept-hr", name: "人力资源部", parentId: null },
    { id: "dept-admin", name: "行政部", parentId: null },
    { id: "dept-it", name: "IT 部", parentId: null },
    { id: "dept-ai-product", name: "AI 产品部", parentId: null },
    { id: "dept-ai-tech", name: "AI 技术部", parentId: null },
    { id: "dept-other", name: "其他", parentId: null }
  ];

  var PEOPLE = [
    { personId: "person-jimmy", name: "李天智 Jimmy", deptId: "dept-ai-tech", hitouchUserId: "jimmy", bound: true },
    { personId: "person-finance-hitouch", name: "大旗财税 HiTouch", deptId: "dept-finance", hitouchUserId: "finance-hitouch", bound: true },
    { personId: "person-admin", name: "大旗行政", deptId: "dept-admin", hitouchUserId: "admin", bound: true },
    { personId: "person-kk", name: "KK 旗旗", deptId: "dept-ai-product", hitouchUserId: "kk", bound: true },
    { personId: "person-rainbow", name: "凌宝 Rainbow", deptId: "dept-market", hitouchUserId: "rainbow", bound: true },
    { personId: "person-m4", name: "M4 贸贸", deptId: "dept-head-business", hitouchUserId: "m4", bound: true },
    { personId: "person-tiantiandd", name: "天天 DD", deptId: "dept-operations", hitouchUserId: "tiantiandd", bound: true },
    { personId: "person-rita", name: "Rita", deptId: "dept-product", hitouchUserId: "rita", bound: true }
  ];

  var LEGACY_DEPARTMENT_IDS = {
    "dept-platform": "dept-product",
    "dept-tax-advisory": "dept-finance",
    "dept-sales": "dept-market",
    "dept-hk-tax": "dept-head-business",
    "dept-legal": "dept-other",
    "平台组": "dept-product",
    "财税顾问部": "dept-finance",
    "销售部": "dept-market",
    "香港税务部": "dept-head-business",
    "法务协同组": "dept-other",
    "人力行政部": "dept-hr"
  };

  // ── Current user ─────────────────────────────────────
  var CURRENT_USER = {
    id: "rita",
    name: "Rita",
    personId: "person-rita",
    deptId: "dept-product"
  };

  // ── Seed data generator ──────────────────────────────
  function makeSeed() {
    return {
      user: CURRENT_USER,
      usedFlowIds: [],

      skills: [
        // === Default Skills ===
        {
          id: "dws",
          origin: "default",
          displayName: "钉钉办公助手",
          internalName: "dws",
          purpose: "查询听记、安排日程、查找同事，并处理待办、审批和钉钉文档。",
          description: "管理钉钉产品能力，包括 AI 表格、AI 搜问、日历、通讯录、待办、审批、考勤、日志、DING 消息及开放平台文档。",
          updatedAt: "2026-07-21",
          version: "3",
          status: "active",
          assignAll: true,
          assignDepts: [],
          assignPeople: [],
          versions: [
            { ver: "3", time: "2026-07-21", note: "补充听记与待办能力", current: true },
            { ver: "2", time: "2026-07-09", note: "更新日历规则",       current: false }
          ]
        },
        {
          id: "bookkeeping",
          origin: "default",
          displayName: "代理记账报价助手",
          internalName: "agent-bookkeeping-quoter",
          purpose: "根据客户行业、票据量、员工数和服务范围，生成代理记账报价建议。",
          description: "当用户需要根据客户行业、票据量、员工数和服务范围生成代理记账报价建议时使用。不触发审计报告和 VAT/EPR 跨境合规。",
          updatedAt: "2026-07-20",
          version: "2",
          status: "active",
          assignAll: false,
          assignDepts: ["dept-finance", "dept-market"],
          assignPeople: ["person-rita"],
          versions: [
            { ver: "2", time: "2026-07-20", note: "增加外资企业报价规则", current: true },
            { ver: "1", time: "2026-07-12", note: "首次导入并开放",       current: false }
          ]
        },
        {
          id: "hk-tax",
          origin: "default",
          displayName: "香港税务资料检查",
          internalName: "hk-tax-review",
          purpose: "检查香港税务申报资料是否齐全，并列出缺失文件和补充事项。",
          description: "面向香港税务团队的申报资料检查流程，适用于利得税和雇主报税资料预审。",
          updatedAt: "2026-07-18",
          version: "1",
          status: "active",
          assignAll: false,
          assignDepts: ["dept-head-business"],
          assignPeople: [],
          versions: [
            { ver: "1", time: "2026-07-18", note: "首次导入并开放", current: true }
          ]
        },
        {
          id: "onboarding",
          origin: "default",
          displayName: "新同事入职助手",
          internalName: "fleet-user-onboarding",
          purpose: "帮助管理员完成新同事账号、Fleet 环境和基础 Skill 配置。",
          description: "管理员为新员工创建 HiTouch 与 Hermes 环境时使用。",
          updatedAt: "2026-07-17",
          version: "1",
          status: "inactive",
          assignAll: false,
          assignDepts: ["dept-ai-tech"],
          assignPeople: [],
          versions: [
            { ver: "1", time: "2026-07-17", note: "导入后停用", current: true }
          ]
        },
        {
          id: "contract",
          origin: "default",
          displayName: "合同风险检查",
          internalName: "contract-risk-review",
          purpose: "检查合同中的关键风险、缺失条款和不规范表述。",
          description: "当用户需要对合同内容进行初步风险检查时使用。",
          updatedAt: "2026-07-15",
          version: "4",
          status: "inactive",
          assignAll: true,
          assignDepts: [],
          assignPeople: [],
          versions: [
            { ver: "4", time: "2026-07-15", note: "停用前版本", current: true }
          ]
        },

        // === Personal Skills ===
        {
          id: "personal-meeting",
          origin: "personal",
          displayName: "会议跟进助手",
          internalName: "meeting-followup",
          purpose: "把会议记录整理成决定、待办、负责人和截止时间。",
          description: "将会议记录整理成决定、待办、负责人和截止时间，适合内部会议跟进。",
          updatedAt: "2026-07-19"
        },
        {
          id: "personal-research",
          origin: "personal",
          displayName: "客户调研助手",
          internalName: "client-research",
          purpose: "",  // auto-generate pending
          pendingPurpose: "在客户拜访前整理企业背景、公开信息、潜在需求和沟通问题。",
          description: "在客户拜访前整理企业背景、公开信息、潜在需求和沟通问题。",
          updatedAt: "2026-07-16"
        }
      ]
    };
  }

  // ── State management ─────────────────────────────────
  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.skills) {
          var before = JSON.stringify(parsed);
          normalizeStoredState(parsed);
          if (JSON.stringify(parsed) !== before) saveState(parsed);
          return parsed;
        }
      }
    } catch (_) {}
    var seed = makeSeed();
    normalizeStoredState(seed);
    saveState(seed);
    return seed;
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function removeDerivedVisibility(state) {
    var changed = false;
    state.skills.forEach(function (skill) {
      if (Object.prototype.hasOwnProperty.call(skill, "visibleToUser")) {
        delete skill.visibleToUser;
        changed = true;
      }
    });
    return changed;
  }

  function normalizeStoredState(state) {
    removeDerivedVisibility(state);
    state.user = normalizeUser(state.user || CURRENT_USER);
    state.skills.forEach(function (skill) {
      delete skill.maintainer;
      delete skill.lastOperator;
      if (skill.origin === "default") {
        normalizeDefaultSkill(skill);
        skill.versions = (skill.versions || []).map(function (version) {
          return normalizeVersionRecord(skill, version);
        });
      }
    });
    delete state.logs;
    return state;
  }

  function normalizeUser(user) {
    var person = findPerson(user.personId || user.id || user.name);
    var department = findDepartment(user.deptId || user.dept);
    var normalized = Object.assign({}, user, {
      id: user.id || (person && person.hitouchUserId) || "",
      name: user.name || (person && person.name) || "",
      personId: (person && person.personId) || cleanText(user.personId),
      deptId: (department && department.id) ||
        (person && person.deptId) || cleanText(user.deptId)
    });
    delete normalized.dept;
    return normalized;
  }

  function resetState() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(FLOW_KEY);
    return loadState();
  }

  // ── Skill queries ────────────────────────────────────
  function getSkill(id) {
    var state = loadState();
    return findSkill(state, id);
  }

  function findSkill(state, id) {
    return state.skills.find(function (skill) { return skill.id === id; }) || null;
  }

  function userInScope(skill, user) {
    return skill.assignAll ||
      validDepartments(skill.assignDepts).some(function (departmentId) {
        return departmentIncludes(departmentId, user.deptId);
      }) ||
      validPeople(skill.assignPeople).indexOf(user.personId) !== -1;
  }

  function getEffectiveSkillIds() {
    return effectiveSkillIdsInState(loadState());
  }

  function effectiveSkillIdsInState(state) {
    return state.skills
      .filter(function (skill) {
        if (skill.origin === "personal") return true;
        return skill.origin === "default" &&
          skill.status === "active" &&
          userInScope(skill, state.user || CURRENT_USER);
      })
      .map(function (skill) { return skill.id; });
  }

  function visibleSkills() {
    var state = loadState();
    var ids = effectiveSkillIdsInState(state);
    return state.skills.filter(function (skill) {
      return ids.indexOf(skill.id) !== -1;
    });
  }

  function isVisible(id) {
    return visibleSkills().some(function (s) { return s.id === id; });
  }

  // ── Assignment helpers ───────────────────────────────
  function uniqueValues(values) {
    return values.filter(function (value, index) {
      return values.indexOf(value) === index;
    });
  }

  function findDepartment(value) {
    var resolvedValue = LEGACY_DEPARTMENT_IDS[value] || value;
    return DEPTS.find(function (department) {
      return department.id === resolvedValue || department.name === resolvedValue;
    }) || null;
  }

  function findPerson(value) {
    return PEOPLE.find(function (person) {
      return person.personId === value ||
        person.hitouchUserId === value ||
        person.name === value;
    }) || null;
  }

  function departmentIncludes(ancestorId, departmentId) {
    var current = findDepartment(departmentId);
    var visited = {};
    while (current && !visited[current.id]) {
      if (current.id === ancestorId) return true;
      visited[current.id] = true;
      current = findDepartment(current.parentId);
    }
    return false;
  }

  function validDepartments(values) {
    if (!Array.isArray(values)) return [];
    return uniqueValues(values.map(function (value) {
      var department = findDepartment(value);
      return department && department.id;
    }).filter(Boolean));
  }

  function validPeople(values) {
    if (!Array.isArray(values)) return [];
    return uniqueValues(values.map(function (value) {
      var person = findPerson(value);
      return person && person.bound ? person.personId : null;
    }).filter(Boolean));
  }

  function assignmentSummary(skill) {
    if (skill.assignAll) return "全员";
    var parts = [];
    var departments = validDepartments(skill.assignDepts);
    var people = validPeople(skill.assignPeople);
    if (departments.length) {
      parts = parts.concat(departments.map(function (departmentId) {
        var department = findDepartment(departmentId);
        return department.name;
      }));
    }
    if (people.length) {
      parts = parts.concat(people.map(function (personId) {
        return findPerson(personId).name;
      }));
    }
    return parts.length ? parts.join("、") : "未配置";
  }

  // ── "Use Skill" flow ─────────────────────────────────
  function createFlow(skillId, request) {
    var cleanRequest = String(request || "").trim();
    if (!cleanRequest) return null;

    var state = loadState();
    var skill = findSkill(state, skillId);
    if (!skill || effectiveSkillIdsInState(state).indexOf(skillId) === -1) return null;

    var flow = {
      id: "flow-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      // Mirrors server-side session metadata. It is never rendered as a chat message.
      selectedSkillId: skillId,
      selectedSkillVersion: skill.origin === "default"
        ? "v" + String(skill.version || "1")
        : "personal@" + String(skill.updatedAt || "current"),
      request: cleanRequest,
      createdAt: Date.now()
    };
    sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow));
    return flow;
  }

  function getFlow() {
    try { return JSON.parse(sessionStorage.getItem(FLOW_KEY)); } catch (_) { return null; }
  }

  // ── Personal skill management ────────────────────────
  function editPersonal(id, displayName, purpose) {
    var state = loadState();
    var skill = findSkill(state, id);
    if (!skill || skill.origin !== "personal") return null;

    skill.displayName = displayName;
    skill.purpose = purpose;
    delete skill.pendingPurpose;
    skill.updatedAt = today();
    saveState(state);
    return skill;
  }

  function deletePersonal(id) {
    var state = loadState();
    var skill = findSkill(state, id);
    if (!skill || skill.origin !== "personal") return false;

    state.skills = state.skills.filter(function (s) { return s.id !== id; });
    try {
      saveState(state);
    } catch (_) {
      return false;
    }
    return true;
  }

  function completePurpose(id, pendingPurpose) {
    var state = loadState();
    var skill = findSkill(state, id);
    if (!skill || !skill.pendingPurpose || skill.pendingPurpose !== pendingPurpose) return null;

    skill.purpose = skill.pendingPurpose;
    delete skill.pendingPurpose;
    saveState(state);
    return skill;
  }

  // ── Default skill management ─────────────────────────
  function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizeDefaultSkill(skill) {
    // 旧状态统一迁移为“启用 / 停用”两态。
    var legacyStatus = {
      published: "active",
      pending: "inactive",
      disabled: "inactive",
      offline: "inactive",
      deleted: "inactive"
    };
    if (legacyStatus[skill.status]) skill.status = legacyStatus[skill.status];
    delete skill.prevStatus;
    delete skill.deletedAt;
    delete skill.deletedBy;
    skill.displayName = cleanText(skill.displayName);
    skill.purpose = cleanText(skill.purpose);
    skill.internalName = cleanText(skill.internalName);
    skill.description = cleanText(skill.description);
    skill.assignAll = skill.assignAll === true;
    skill.assignDepts = skill.assignAll ? [] : validDepartments(skill.assignDepts);
    skill.assignPeople = skill.assignAll ? [] : validPeople(skill.assignPeople);
    return skill;
  }

  function hasParsedMetadata(skill) {
    return Boolean(cleanText(skill.internalName) && cleanText(skill.description));
  }

  function hasValidAssignment(skill) {
    return skill.assignAll === true ||
      validDepartments(skill.assignDepts).length > 0 ||
      validPeople(skill.assignPeople).length > 0;
  }

  function isUsable(skill) {
    var candidate = normalizeDefaultSkill(clone(skill));
    return Boolean(candidate.displayName && candidate.purpose &&
      hasParsedMetadata(candidate) && hasValidAssignment(candidate));
  }

  function parsedZipOptions(opts) {
    var fileName = cleanText(opts.fileName);
    var internalName = cleanText(opts.internalName);
    var description = cleanText(opts.description);
    var isGit = opts.source === "git" && cleanText(opts.repository) === "HiTouchAI/hitouch-skills" &&
      cleanText(opts.skillPath) && cleanText(opts.commit);
    if (!fileName || (!/\.zip$/i.test(fileName) && !isGit) || opts.validZip !== true ||
        !internalName || !description) return null;
    return {
      fileName: fileName,
      internalName: internalName,
      description: description,
      source: isGit ? "git" : "zip",
      repository: isGit ? cleanText(opts.repository) : "",
      skillPath: isGit ? cleanText(opts.skillPath) : "",
      commit: isGit ? cleanText(opts.commit) : ""
    };
  }

  function mockChecksum(fileName, skillId, version) {
    var input = [fileName, skillId, version].join(":");
    var hash = 2166136261;
    for (var index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return "sha256:mock-" + (hash >>> 0).toString(16).padStart(8, "0");
  }

  function normalizeVersionRecord(skill, version, fileName) {
    var normalized = Object.assign({}, version);
    delete normalized.who;
    normalized.zipFile = cleanText(normalized.zipFile) ||
      cleanText(fileName) ||
      (cleanText(skill.internalName) || skill.id) + "-v" + normalized.ver + ".zip";
    normalized.checksum = cleanText(normalized.checksum) ||
      mockChecksum(normalized.zipFile, skill.id, normalized.ver);
    normalized.gitCommit = cleanText(normalized.gitCommit) ||
      "mock/" + skill.id + "/v" + normalized.ver;
    normalized.source = cleanText(normalized.source) || "zip";
    normalized.repository = cleanText(normalized.repository);
    normalized.skillPath = cleanText(normalized.skillPath);
    return normalized;
  }

  function occupiedInternalNames(state, excludeId) {
    return state.skills.filter(function (skill) {
      return skill.id !== excludeId;
    }).map(function (skill) {
      return cleanText(skill.effectiveInternalName || skill.internalName);
    }).filter(Boolean);
  }

  function allocateEffectiveInternalName(state, internalName, excludeId) {
    var occupied = occupiedInternalNames(state, excludeId);
    var candidate = internalName;
    var index = 1;
    while (occupied.indexOf(candidate) !== -1) {
      candidate = internalName + "-" + index;
      index += 1;
    }
    return candidate;
  }

  function updateDefaultInState(state, skill, changes) {
    if (!skill || skill.origin !== "default") return null;

    Object.keys(changes).forEach(function (key) {
      skill[key] = changes[key];
    });
    normalizeDefaultSkill(skill);
    skill.updatedAt = today();

    saveState(state);
    return skill;
  }

  var DEFAULT_METADATA_FIELDS = {
    displayName: true,
    purpose: true,
    assignAll: true,
    assignDepts: true,
    assignPeople: true
  };

  function updateDefault(id, changes) {
    if (!changes || typeof changes !== "object") return null;

    var metadata = {};
    Object.keys(changes).forEach(function (key) {
      if (key !== "visibleToUser" && DEFAULT_METADATA_FIELDS[key]) {
        metadata[key] = changes[key];
      }
    });
    if (Object.keys(metadata).length !== Object.keys(changes).filter(function (key) {
      return key !== "visibleToUser";
    }).length) return null;

    var state = loadState();
    var skill = findSkill(state, id);
    if (!skill || skill.origin !== "default") return null;
    var candidate = normalizeDefaultSkill(Object.assign(clone(skill), metadata));
    if (!isUsable(candidate)) return null;
    return updateDefaultInState(state, skill, metadataFromCandidate(candidate));
  }

  function metadataFromCandidate(candidate) {
    return {
      displayName: candidate.displayName,
      purpose: candidate.purpose,
      assignAll: candidate.assignAll,
      assignDepts: candidate.assignDepts,
      assignPeople: candidate.assignPeople
    };
  }

  var TRANSITIONS = {
    active: { deactivate: "inactive" },
    inactive: { activate: "active" }
  };

  function transitionDefault(id, event) {
    var state = loadState();
    var skill = findSkill(state, id);
    var next = skill && TRANSITIONS[skill.status] &&
      TRANSITIONS[skill.status][event];
    if (!next) return null;
    var candidate = normalizeDefaultSkill(clone(skill));
    candidate.status = next;
    if (next === "active" && !isUsable(candidate)) return null;
    return updateDefaultInState(state, skill, { status: next });
  }

  function uploadSkill(opts) {
    opts = opts || {};
    var state = loadState();
    var parsed = parsedZipOptions(opts);
    if (!parsed) return null;

    if (opts.replaceId) {
      var replacement = findSkill(state, opts.replaceId);
      var updateNote = cleanText(opts.updateNote);
      if (!replacement || replacement.origin !== "default" || !updateNote) return null;

      var versions = clone(replacement.versions || []);
      versions.forEach(function (version) { version.current = false; });
      var nextVersion = String(Number(replacement.version || "0") + 1);
      var previousInternalName = cleanText(replacement.internalName);
      var previousEffectiveName = cleanText(
        replacement.effectiveInternalName || replacement.internalName
      );
      var candidate = normalizeDefaultSkill(Object.assign(clone(replacement), {
        internalName: parsed.internalName,
        description: parsed.description
      }));
      candidate.effectiveInternalName =
        parsed.internalName === previousInternalName &&
        occupiedInternalNames(state, replacement.id).indexOf(previousEffectiveName) === -1
          ? previousEffectiveName
          : allocateEffectiveInternalName(state, parsed.internalName, replacement.id);
      if (!isUsable(candidate)) return null;
      versions.unshift(normalizeVersionRecord(replacement, {
        ver: nextVersion,
        time: today(),
        note: updateNote,
        current: true,
        source: parsed.source,
        repository: parsed.repository,
        skillPath: parsed.skillPath,
        gitCommit: parsed.source === "git" ? parsed.commit : ""
      }, parsed.fileName));
      return updateDefaultInState(state, replacement, {
        internalName: candidate.internalName,
        effectiveInternalName: candidate.effectiveInternalName,
        description: candidate.description,
        version: nextVersion,
        versions: versions
      });
    }

    var displayName = typeof opts.displayName === "string"
      ? cleanText(opts.displayName)
      : "";
    var purpose = typeof opts.purpose === "string"
      ? cleanText(opts.purpose)
      : "";
    var assignAll = opts.assignAll !== false;
    var assignDepts = assignAll ? [] : validDepartments(opts.assignDepts);
    var assignPeople = assignAll ? [] : validPeople(opts.assignPeople);

    var name = displayName;
    var idx = 1;
    while (name && state.skills.some(function (s) { return s.displayName === name; })) {
      name = displayName + " " + (idx++);
    }

    var idBase = "upload-" + Date.now();
    var id = idBase;
    var idIndex = 1;
    while (findSkill(state, id)) {
      id = idBase + "-" + idIndex;
      idIndex += 1;
    }
    var now = today();
    var newSkill = normalizeDefaultSkill({
      id: id,
      origin: "default",
      displayName: name,
      internalName: parsed.internalName,
      effectiveInternalName: allocateEffectiveInternalName(state, parsed.internalName),
      purpose: purpose,
      description: parsed.description,
      updatedAt: now,
      version: "1",
      status: "active",
      assignAll: assignAll,
      assignDepts: assignDepts,
      assignPeople: assignPeople,
      versions: []
    });
    newSkill.versions = [normalizeVersionRecord(newSkill, {
      ver: "1",
      time: now,
      note: "首次上传",
      current: true,
      source: parsed.source,
      repository: parsed.repository,
      skillPath: parsed.skillPath,
      gitCommit: parsed.source === "git" ? parsed.commit : ""
    }, parsed.fileName)];
    if (!isUsable(newSkill)) return null;
    state.skills.unshift(newSkill);
    saveState(state);
    return newSkill;
  }

  // ── Utilities ────────────────────────────────────────
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function today() { return new Date().toISOString().slice(0, 10); }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getParam(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function buildUrl(file, params) {
    var sp = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      if (v !== undefined && v !== null && v !== "") sp.set(k, v);
    });
    var qs = sp.toString();
    return file + (qs ? "?" + qs : "");
  }

  // ── Exports ──────────────────────────────────────────
  window.S = {
    // State
    STORAGE_KEY: STORAGE_KEY,
    FLOW_KEY: FLOW_KEY,
    loadState: loadState,
    saveState: saveState,
    resetState: resetState,

    // Skills
    getSkill: getSkill,
    visibleSkills: visibleSkills,
    isVisible: isVisible,
    getEffectiveSkillIds: getEffectiveSkillIds,

    // Assignment
    DEPTS: DEPTS,
    PEOPLE: PEOPLE,
    assignmentSummary: assignmentSummary,

    // Flows
    createFlow: createFlow,
    getFlow: getFlow,

    // Personal
    editPersonal: editPersonal,
    deletePersonal: deletePersonal,
    completePurpose: completePurpose,

    // Admin
    updateDefault: updateDefault,
    transitionDefault: transitionDefault,
    uploadSkill: uploadSkill,

    // Utils
    clone: clone,
    today: today,
    escapeHtml: escapeHtml,
    getParam: getParam,
    buildUrl: buildUrl
  };
})();
