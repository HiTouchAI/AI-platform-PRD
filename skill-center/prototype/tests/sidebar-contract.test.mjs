import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = relative => readFileSync(new URL(relative, root), "utf8");

function mountShell(options) {
  const shell = { innerHTML: "" };
  const window = {};
  const document = {
    body: shell,
    querySelector() {
      return shell;
    }
  };
  vm.runInNewContext(read("assets/common.js"), { window, document });
  window.UI.mountShell({ ...options, root: shell });
  return shell.innerHTML;
}

test("mountShell runtime provides named Skill and application rail items", () => {
  const html = mountShell({ active: "chat" });
  assert.match(html, /<span class="tooltip rail-tip" role="tooltip">Skill 中心<\/span>/);
  assert.match(html, /<span class="tooltip rail-tip" role="tooltip">应用中心<\/span>/);
  const css = read("assets/base.css");
  assert.match(css, /\.rail-tip \{/);
  assert.match(css, /\.rail-item:hover \.rail-tip/);
});

test("mountShell runtime resolves links, passive items, and active page state", () => {
  const chat = mountShell({ active: "chat" });
  const skills = mountShell({ active: "skills" });

  assert.match(chat, /class="rail-item icon-button active" href="session\.html"[^>]*aria-current="page"/);
  assert.match(chat, /class="rail-item icon-button" href="skill-center\.html"/);
  assert.match(skills, /class="rail-item icon-button" href="session\.html"/);
  assert.match(skills, /class="rail-item icon-button active" href="skill-center\.html"[^>]*aria-current="page"/);
  assert.match(chat, /aria-label="日历" aria-disabled="true"/);
  assert.match(chat, /aria-label="应用中心" aria-disabled="true"/);
  assert.doesNotMatch(chat, /app-center\.html/);
  assert.doesNotMatch(skills, /app-center\.html/);
});

test("Skill center removes the context sidebar while Hermes keeps its default context", () => {
  const session = read("session.html");
  const skills = read("skill-center.html");
  assert.match(session, /UI\.mountShell\(\{[\s\S]*?active: "chat"/);
  assert.match(session, /showWorkspace: true/);
  assert.match(session, /showContext: true/);
  assert.match(skills, /UI\.mountShell\(\{[\s\S]*?active: "skills"/);
  assert.match(skills, /showWorkspace: false/);
  assert.match(skills, /showContext: false/);
  assert.doesNotMatch(skills, /contextItems:/);
  assert.doesNotMatch(skills, /syncManagementContext/);
  assert.match(skills, /UI\.useSkill/);
  assert.match(mountShell({ active: "chat", showWorkspace: true }), /class="workspace-panel"/);
  assert.match(mountShell({ active: "chat", contextItems: [{ label: "当前对话" }] }), /class="context-sidebar"/);
  assert.doesNotMatch(
    mountShell({ active: "skills", showContext: false, contextItems: [{ label: "不应渲染" }] }),
    /class="context-sidebar"/
  );
  assert.doesNotMatch(mountShell({ active: "skills", showWorkspace: false }), /class="workspace-panel"/);
});

test("no-context shell uses only the 48px rail and a flexible main surface", () => {
  const css = read("assets/base.css");
  assert.match(css, /\.app-frame\.no-context\s*\{[^}]*grid-template-columns:\s*var\(--rail-width\) minmax\(0, 1fr\)/);
  assert.match(css, /\.app-frame\.no-context\.has-workspace\s*\{[^}]*grid-template-columns:\s*var\(--rail-width\) minmax\(0, 1fr\) minmax\(240px, 300px\)/);
});

test("原型始终以最高权限展示同页管理入口", () => {
  const data = read("assets/data.js");
  const skills = read("skill-center.html");
  assert.match(skills, /mode: "manage"/);
  assert.doesNotMatch(data, /canManageSkills/);
  assert.doesNotMatch(skills, /canManageSkills/);
  assert.doesNotMatch(skills, /href="admin\.html"/);
});

test("管理能力由同页模块提供", () => {
  const admin = read("assets/skill-admin.js");
  const skills = read("skill-center.html");
  assert.match(admin, /window\.Admin = \{ mount/);
  assert.match(admin, /function renderSkills\(focusSkillId\)/);
  assert.doesNotMatch(admin, /function renderRecycle|function renderLogs|openRestoreDialog/);
  assert.match(admin, /href="skill-center\.html"/);
  assert.match(skills, /<script src="assets\/skill-admin\.js"><\/script>/);
  assert.match(skills, /Admin\.mount\(content\);/);
});

test("原型不再交付独立管理页", () => {
  const index = read("index.html");
  const readme = read("README.md");
  assert.doesNotMatch(index, /admin\.html/);
  assert.doesNotMatch(readme, /默认 Skill 管理后台：`admin\.html`/);
});

test("兼容 Demo 只提供统一的 Skill 中心入口", () => {
  const demo = readFileSync(new URL("../../Skill中心一期Demo.html", import.meta.url), "utf8");
  assert.match(demo, /href="prototype\/index\.html"/);
  assert.doesNotMatch(demo, /admin\.html/);
  assert.doesNotMatch(demo, /管理后台/);
});
