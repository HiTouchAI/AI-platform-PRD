import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = relative => readFileSync(new URL(relative, root), "utf8");
const emojiPattern = /[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F]/u;

function loadDeleteDialog(deletePersonal) {
  function element(tagName) {
    return {
      tagName,
      attributes: {},
      children: [],
      className: "",
      dataset: {},
      parentNode: null,
      style: {},
      appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
      },
      removeChild(child) {
        this.children.splice(this.children.indexOf(child), 1);
        child.parentNode = null;
      },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      getAttribute(name) { return this.attributes[name] || null; },
      addEventListener() {},
      focus() {},
      querySelector(selector) {
        if (selector === ".dialog") {
          this.dialog = this.dialog || element("section");
          return this.dialog;
        }
        if (selector === "[data-action=confirm]") {
          this.confirmButton = this.confirmButton || element("button");
          return this.confirmButton;
        }
        return null;
      },
      querySelectorAll() { return []; }
    };
  }

  const body = element("body");
  const document = {
    activeElement: null,
    body,
    contains() { return false; },
    createElement: element,
    querySelector(selector) {
      if (selector !== ".toast") return null;
      return body.children.find(child => child.className.split(" ").includes("toast")) || null;
    }
  };
  const window = {
    S: {
      getSkill() { return { id: "personal", origin: "personal", displayName: "我的 Skill" }; },
      deletePersonal
    },
    setTimeout() {},
    getComputedStyle() { return { display: "block", visibility: "visible" }; }
  };
  window.window = window;
  vm.runInContext(read("assets/common.js"), vm.createContext({ document, window }));
  return { UI: window.UI, document };
}

test("shell exposes the 48px rail and 300px context sidebar", () => {
  const css = read("assets/base.css");
  assert.match(css, /--rail-width:\s*48px/);
  assert.match(css, /--context-width:\s*300px/);
});

test("shared UI uses Lucide icons and accessible labels", () => {
  const js = read("assets/common.js");
  assert.match(js, /data-lucide=/);
  assert.match(js, /function mountShell/);
  assert.match(js, /aria-label/);
});

test("production sources contain no emoji glyphs or unused Skill icon fields", () => {
  const productionSources = [
    "assets/base.css",
    "assets/common.js",
    "assets/data.js",
    "assets/skill-admin.js",
    "index.html",
    "session.html",
    "skill-center.html",
    "README.md"
  ];
  for (const file of productionSources) {
    assert.doesNotMatch(read(file), emojiPattern, `${file} contains an emoji glyph`);
  }
  assert.doesNotMatch(read("assets/data.js"), /^\s*icon:\s*/m);
  assert.doesNotMatch(
    readFileSync(new URL("../../Skill中心一期Demo.html", import.meta.url), "utf8"),
    emojiPattern
  );
  assert.doesNotMatch(
    readFileSync(new URL("../../Skill中心原型交接.md", import.meta.url), "utf8"),
    emojiPattern
  );
});

test("layer close paths keep Escape and explicit cancel available while submitting", () => {
  const js = read("assets/common.js");
  const closeLayer = js.match(/function closeLayer\(layer\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  assert.doesNotMatch(closeLayer, /dataset\.submitting/);
  assert.match(js, /event\.target === layer && layer\.dataset\.submitting !== "true"/);
  assert.match(js, /closeLayer\(activeLayer\);\n    var layer = document\.createElement/);
});

test("layer focus only includes visible interactive elements", () => {
  const js = read("assets/common.js");
  const getFocusable = js.match(/function getFocusable\(layer\) \{([\s\S]*?)\n  \}/)?.[1] || "";
  assert.match(js, /function isFocusableVisible\(element\)/);
  assert.match(js, /getComputedStyle\(/);
  assert.match(js, /return isFocusableVisible\(element\);/);
  assert.match(getFocusable, /\[contenteditable="true"\]/);
  assert.match(js, /firstField = focusable\.filter/);
});

test("shell does not create placeholder navigation links and announces the active page", () => {
  const js = read("assets/common.js");
  assert.doesNotMatch(js, /item\.href \|\| "#"/);
  assert.doesNotMatch(js, /calendarHref \|\| "#"/);
  assert.doesNotMatch(js, /appsHref \|\| "#"/);
  assert.match(js, /aria-current="page"/);
  assert.match(js, /if \(!item\.href\)[\s\S]*?aria-disabled="true"/);
  assert.match(js, /aria-disabled="true"' \+ current/);
});

test("shared visual primitives provide bounded-radius controls and explicit desktop grids", () => {
  const css = read("assets/base.css");
  const iconButton = css.match(/\.icon-button\s*\{([^}]*)\}/)?.[1] || "";
  assert.match(css, /\.icon-button\s*\{/);
  assert.match(iconButton, /position:\s*relative/);
  assert.match(iconButton, /width:\s*36px/);
  assert.match(iconButton, /height:\s*36px/);
  assert.match(css, /\.tooltip\s*,\s*\.rail-tip\s*\{/);
  assert.match(css, /\.icon-button:hover[\s\S]*?\.icon-button:focus-visible/);
  assert.doesNotMatch(css, /border-radius:\s*999px/);
  assert.match(css, /@media \(min-width: 1280px\)[\s\S]*?\.grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(min-width: 1440px\)[\s\S]*?\.grid\s*\{[^}]*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\)/);
});

test("workbench common functions include a Skill center entry", () => {
  const html = read("index.html");
  assert.match(html, /href="skill-center\.html"/);
  assert.match(html, /当前可用/);
  assert.match(html, /data-lucide="sparkles"/);
  assert.match(html, /S\.visibleSkills\(\)\.length/);
});

test("workbench application center is a disabled display-only entry", () => {
  const html = read("index.html");
  assert.match(html, /<div class="card card-body"[^>]*aria-disabled="true"[^>]*>[\s\S]*?data-workbench-icon="grid-2x2"[\s\S]*?<h3[^>]*>应用中心<\/h3>[\s\S]*?仅展示/);
  assert.doesNotMatch(html, /href="[^\"]*(?:app-center|应用中心)[^\"]*"/);
});

test("workbench common functions retain the existing confirmation center", () => {
  const html = read("index.html");
  assert.match(html, /data-workbench-icon="circle-check"[\s\S]*?<h3[^>]*>确认中心<\/h3>/);
  assert.doesNotMatch(html, /<h3[^>]*>发起对话<\/h3>/);
});

test("session mounts the Hermes shell with Workspace", () => {
  const session = read("session.html");
  assert.match(session, /UI\.mountShell\(\{[\s\S]*?active:\s*"chat"/);
  assert.match(session, /showWorkspace:\s*true/);
  assert.match(session, /id="chat-view"/);
});

test("session renders both flow acknowledgement and normal empty conversation", () => {
  const session = read("session.html");
  assert.match(session, /S\.getFlow\(\)/);
  assert.match(session, /flow\.request/);
  assert.doesNotMatch(session, /本次已使用|selectedSkillId|selectedSkillVersion/);
  assert.doesNotMatch(session, /flow\.internalName/);
  assert.doesNotMatch(session, /<strong>\//);
  assert.match(session, /你好，我是 HiTouch/);
  assert.doesNotMatch(session, /<input[^>]*flow/i);
});

test("usage center implements card wall, source filters and explicit actions", () => {
  const html = read("skill-center.html");
  assert.match(html, /全部/);
  assert.match(html, /我创建的/);
  assert.match(html, /class="skill-card-grid"/);
  assert.match(html, /data-action="detail"/);
  assert.match(html, /data-action="use"/);
});

test("detail never renders hidden Skill file fields", () => {
  const html = read("skill-center.html");
  assert.doesNotMatch(html, /skill\.markdown/);
  assert.doesNotMatch(html, /skill\.description[^)]/);
  assert.doesNotMatch(html, /AI 识别说明/);
});

test("usage center only renders versions for default Skills", () => {
  const html = read("skill-center.html");
  const versionConditions = html.match(/var version = skill\.origin === "default" && skill\.version \?/g) || [];
  assert.equal(versionConditions.length, 2);
});

test("usage center refreshes icons after rendering every empty state", () => {
  const html = read("skill-center.html");
  const drawList = html.match(/function drawList\(\) \{([\s\S]*?)\n    \}/)?.[1] || "";
  assert.match(drawList, /if \(result\.skills\.length\) \{[\s\S]*?UI\.refreshIcons\(grid\);[\s\S]*?return;[\s\S]*?UI\.refreshIcons\(grid\);/);
});

test("use dialog protects creation while retaining cancel and Escape close paths", () => {
  const common = read("assets/common.js");
  assert.match(common, /request\.trim\(\)/);
  assert.match(common, /aria-busy/);
  assert.match(common, /该 Skill 已不可用/);
  assert.match(common, /loader-circle/);
  assert.match(common, /submit\.disabled = true/);
  assert.match(common, /overlay\.dataset\.submitting = "true"/);
  assert.match(common, /event\.key === "Escape"/);
  assert.match(common, /data-action="cancel"/);
  assert.doesNotMatch(common, /内部名称 <code>|SKILL\.md|AI 上下文|\/" \+ escapeHtml\(skill\.internalName\)/);
});

test("use dialog defers creation and ignores a cancelled dialog callback", () => {
  const common = read("assets/common.js");
  const useSkill = common.match(/function useSkill\(skillId, onAccessRevoked\) \{([\s\S]*?)\n  \}\n\n  function editPersonal/)?.[1] || "";
  assert.match(useSkill, /window\.setTimeout\(function \(\) \{/);
  assert.match(useSkill, /if \(!overlay\.isConnected \|\| cancelled \|\| navigated\) return;/);
  assert.match(useSkill, /flow = S\.createFlow\(skillId, request\)/);
  assert.match(useSkill, /overlay\._onClose = function \(\) \{[\s\S]*?cancelled = true;/);
});

test("personal deletion reports failure and refreshes stale detail state", () => {
  const common = read("assets/common.js");
  const deletePersonal = common.match(/function deletePersonal\(skillId, onFinished\) \{([\s\S]*?)\n  \}\n\n  window\.UI/)?.[1] || "";
  assert.match(deletePersonal, /try \{/);
  assert.match(deletePersonal, /catch \(_\)/);
  assert.match(deletePersonal, /删除失败，请刷新后重试。/);
  assert.match(deletePersonal, /if \(onFinished\) onFinished\(false\);/);
  assert.match(deletePersonal, /if \(onFinished\) onFinished\(true\);/);
  assert.match(deletePersonal, /toast\("Skill 已删除/);
});

test("personal deletion only signals navigation-ready success after confirmation", () => {
  for (const deletePersonal of [() => false, () => { throw new Error("storage failed"); }]) {
    const { UI, document } = loadDeleteDialog(deletePersonal);
    const results = [];
    let navigations = 0;
    let refreshes = 0;
    UI.deletePersonal("personal", success => {
      results.push(success);
      if (success) navigations += 1;
      else refreshes += 1;
    });
    document.body.children[0].querySelector("[data-action=confirm]").onclick();
    assert.deepEqual(results, [false]);
    assert.equal(navigations, 0);
    assert.equal(refreshes, 1);
    assert.equal(document.querySelector(".toast").textContent, "删除失败，请刷新后重试。");
  }

  const { UI, document } = loadDeleteDialog(() => true);
  let navigations = 0;
  UI.deletePersonal("personal", success => { if (success) navigations += 1; });
  document.body.children[0].querySelector("[data-action=confirm]").onclick();
  assert.equal(navigations, 1);
  assert.equal(document.querySelector(".toast").textContent, "Skill 已删除，新对话不再加载。");
});

test("personal deletion names the target and describes its irreversible directory removal", () => {
  const common = read("assets/common.js");
  assert.match(common, /删除「" \+ skill\.displayName \+ "」？/);
  assert.match(common, /对应的 Skill 目录/);
  assert.match(common, /删除后无法从 Skill 中心恢复/);
});

test("purpose generation can fail and retry without removing the use action", () => {
  const html = read("skill-center.html");
  assert.match(html, /purposeStates/);
  assert.match(html, /用途生成失败/);
  assert.match(html, /data-action="retry-purpose"/);
  assert.match(html, /data-action="use"/);
  assert.match(html, /var pendingPurpose = skill && skill\.pendingPurpose/);
  assert.match(html, /S\.completePurpose\(skillId, pendingPurpose\)/);
});

test("detail only navigates after a successful personal deletion", () => {
  const html = read("skill-center.html");
  assert.match(html, /UI\.deletePersonal\(trigger\.dataset\.id, function \(success\) \{[\s\S]*?if \(success\) \{[\s\S]*?location\.href = listUrl\(\);[\s\S]*?\} else \{[\s\S]*?renderDetail\(\);/);
});
