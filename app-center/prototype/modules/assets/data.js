(function () {
  "use strict";

  const STATE_KEY = "hitouch-app-center-demo-v2";
  const FLOW_KEY = "hitouch-app-center-flow-v2";

  const seedApps = [
    { id: 1, name: "增值税计算器", icon: "🧮", author: "Rita", problem: "快速计算增值税及附加税费，支持一般纳税人和小规模纳税人。", scenario: "销售与财务日常报价、开票前的税额核算", likes: 42, usageCount: 356, usageUsers: 89, version: "1.0.0", publishedAt: "2026-07-15", isMine: true, online: true },
    { id: 2, name: "个税测算工具", icon: "💰", author: "Rita", problem: "输入税前工资，自动计算个税、社保公积金。", scenario: "HR 薪酬核算、员工预估税后收入", likes: 38, usageCount: 289, usageUsers: 67, version: "1.0.0", publishedAt: "2026-07-14", isMine: true, online: true },
    { id: 3, name: "香港利得税测算", icon: "🇭🇰", author: "William", problem: "根据香港公司收入和可扣除开支测算利得税。", scenario: "香港公司年度税务申报前的税额预估", likes: 35, usageCount: 203, usageUsers: 52, version: "1.0.0", publishedAt: "2026-07-10", isMine: false, online: true },
    { id: 4, name: "汇率转换器", icon: "💱", author: "Jett", problem: "实时汇率查询与多币种批量换算。", scenario: "跨境业务报价、外币合同金额换算", likes: 31, usageCount: 412, usageUsers: 76, version: "1.0.0", publishedAt: "2026-07-12", isMine: false, online: true },
    { id: 5, name: "合同条款检查器", icon: "📋", author: "Rita", problem: "检查合同缺失条款、风险提示和不规范表述。", scenario: "合同审核前的快速自查", likes: 28, usageCount: 178, usageUsers: 45, version: "1.0.0", publishedAt: "2026-07-05", isMine: true, online: false },
    { id: 6, name: "客户信息收集表", icon: "📝", author: "William", problem: "标准化客户信息收集并生成在线表单。", scenario: "新客户接洽时的信息登记与归档", likes: 25, usageCount: 156, usageUsers: 41, version: "1.0.0", publishedAt: "2026-07-08", isMine: false, online: true }
  ];

  const clone = value => JSON.parse(JSON.stringify(value));
  const initialState = () => ({
    apps: clone(seedApps),
    likedIds: [2],
    usedIds: [],
    countedOpenIds: [],
    processedPublicationIds: []
  });

  function migrateState(state) {
    state.likedIds ||= [];
    state.usedIds ||= [];
    state.countedOpenIds ||= [];
    state.processedPublicationIds ||= [];
    state.apps.forEach(app => {
      app.version ||= "1.0.0";
      app.publishedAt ||= app.versions?.[0]?.time || today();
    });
    return state;
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STATE_KEY));
      if (parsed && Array.isArray(parsed.apps)) return migrateState(parsed);
    } catch (_) {}
    const state = initialState();
    saveState(state);
    return state;
  }

  function saveState(state) { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
  function resetState() {
    localStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(FLOW_KEY);
    return loadState();
  }
  function getApp(id, state = loadState()) { return state.apps.find(app => app.id === Number(id)); }
  function today() { return new Date().toLocaleDateString("sv-SE"); }
  function normalizeName(name) { return String(name || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("zh-CN"); }
  function isDuplicateName(name, excludedId = null, state = loadState()) {
    const normalized = normalizeName(name);
    return state.apps.some(app => app.id !== Number(excludedId) && normalizeName(app.name) === normalized);
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function params() { return new URLSearchParams(location.search); }
  function path(file, values = {}) {
    const query = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const text = query.toString();
    return `${file}${text ? `?${text}` : ""}`;
  }

  function getFlow() {
    try { return JSON.parse(sessionStorage.getItem(FLOW_KEY)) || null; }
    catch (_) { return null; }
  }
  function setFlow(flow) { sessionStorage.setItem(FLOW_KEY, JSON.stringify(flow)); return flow; }
  function clearFlow() { sessionStorage.removeItem(FLOW_KEY); }

  function createPublishedApp(draft, flowId) {
    const state = loadState();
    const flow = getFlow();
    if (!flow || flow.id !== flowId) return { ok: false, error: "发布上下文已失效。" };
    if (state.processedPublicationIds.includes(flowId) && flow.publishedAppId) {
      return { ok: true, appId: flow.publishedAppId, duplicate: true };
    }
    if (flow.checkStatus !== "passed") return { ok: false, error: flow.checkError || "HTML 未通过发布检查。" };

    const clean = {
      name: String(draft.name || "").trim(),
      icon: String(draft.icon || "").trim(),
      problem: String(draft.problem || "").trim(),
      scenario: String(draft.scenario || "").trim()
    };
    if (!clean.name || !clean.icon || !clean.problem || !clean.scenario) {
      return { ok: false, error: "请填写应用名称、图标、解决的问题和适用场景。" };
    }
    if (isDuplicateName(clean.name, null, state)) {
      return { ok: false, error: `名称「${clean.name}」已被占用。` };
    }

    const appId = state.apps.length ? Math.max(...state.apps.map(app => app.id)) + 1 : 1;
    state.apps.push({
      id: appId,
      name: clean.name,
      icon: clean.icon,
      author: "Rita",
      problem: clean.problem,
      scenario: clean.scenario,
      likes: 0,
      usageCount: 0,
      usageUsers: 0,
      version: "1.0.0",
      publishedAt: today(),
      isMine: true,
      online: true,
      sourceSessionId: flow.sourceSessionId || "session-demo",
      sourceMessageId: flow.sourceMessageId || "message-demo",
      sourceHtmlUrl: flow.originalUrl,
      htmlSnapshot: flow.htmlSnapshot || "<!doctype html><title>HiTouch 应用快照</title>"
    });
    state.processedPublicationIds.push(flowId);
    saveState(state);
    setFlow({ ...flow, publishedAppId: appId });
    return { ok: true, appId, duplicate: false };
  }

  function toggleLike(id) {
    const state = loadState();
    const app = getApp(id, state);
    if (!app || !app.online) return null;
    const index = state.likedIds.indexOf(app.id);
    if (index >= 0) {
      state.likedIds.splice(index, 1);
      app.likes = Math.max(0, app.likes - 1);
    } else {
      state.likedIds.push(app.id);
      app.likes += 1;
    }
    saveState(state);
    return app;
  }

  function recordUse(id, openId) {
    const state = loadState();
    const app = getApp(id, state);
    if (!app || !app.online || !openId) return null;
    if (state.countedOpenIds.includes(openId)) return app;
    state.countedOpenIds.push(openId);
    app.usageCount += 1;
    if (!state.usedIds.includes(app.id)) {
      state.usedIds.push(app.id);
      app.usageUsers += 1;
    }
    saveState(state);
    return app;
  }

  window.HiTouchDemo = {
    STATE_KEY, FLOW_KEY,
    loadState, saveState, resetState, getApp,
    getFlow, setFlow, clearFlow, createPublishedApp,
    toggleLike, recordUse, today, normalizeName,
    isDuplicateName, escapeHtml, params, path
  };
})();
