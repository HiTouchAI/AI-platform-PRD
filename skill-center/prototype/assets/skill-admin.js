/* Default Skill management embedded in the Skill center. */
(function () {
  "use strict";

  var S = window.S;
  var UI = window.UI;
  var ACTION_LABELS = {
    edit: "编辑",
    replace: "更新内容",
    activate: "重新启用",
    deactivate: "停用",
    versions: "查看版本"
  };
  var TRANSITION_COPY = {
    activate: {
      result: "启用",
      message: "重新启用后，命中分配范围的员工可见，并在新 Session 中加载。",
      toast: "Skill 已重新启用。"
    },
    deactivate: {
      result: "已停用",
      message: "停用后用户立即不可见，新 Session 不再加载；版本、范围和历史 Session 保持不变。",
      toast: "Skill 已停用。"
    }
  };

  function mount(container) {
    var currentQuery = "";
    var currentStatus = "all";

    renderSkills();

    function pageNavigation() {
      return '<nav class="section-tabs" aria-label="Skill 中心页面">' +
        '<a class="section-tab" href="skill-center.html">使用中心</a>' +
        '<span class="section-tab active" aria-current="page">管理</span>' +
      '</nav>';
    }

    function renderSkills(focusSkillId) {
      container.innerHTML =
        '<section class="page admin-page" aria-labelledby="admin-title">' +
          pageNavigation() +
          '<header class="admin-header">' +
            '<div><h1 id="admin-title" tabindex="-1">默认 Skill 管理</h1>' +
              '<p class="muted">导入后默认对全员开放；有需要时可调整范围或停用。</p></div>' +
            '<button class="btn btn-primary" type="button" id="admin-upload">' +
              UI.icon("upload") + '<span>导入 / 上传 Skill</span></button>' +
          '</header>' +
          '<div class="tabs admin-status-tabs" aria-label="启用状态筛选">' +
            statusFilterTab("all", "全部") +
            statusFilterTab("active", "启用中") +
            statusFilterTab("inactive", "已停用") +
          '</div>' +
          '<div class="admin-toolbar">' +
            '<div class="search-box admin-search">' +
              '<label class="sr-only" for="admin-search">搜索默认 Skill</label>' +
              UI.icon("search", 'class="search-icon"') +
              '<input id="admin-search" type="search" value="' + S.escapeHtml(currentQuery) +
                '" placeholder="搜索展示名称、内部名称或作用">' +
            '</div>' +
            '<span class="admin-result-count" id="admin-result-count" aria-live="polite"></span>' +
          '</div>' +
          '<div class="table-wrap admin-table-wrap">' +
            '<table class="admin-table">' +
              '<thead><tr>' +
                '<th>展示名称和内部名称</th><th>作用</th><th>版本</th>' +
                '<th>分配范围</th><th>更新时间</th>' +
                '<th>操作</th>' +
              '</tr></thead>' +
              '<tbody id="admin-skill-rows"></tbody>' +
            '</table>' +
          '</div>' +
        '</section>';

      var search = container.querySelector("#admin-search");
      search.addEventListener("input", function () {
        currentQuery = search.value.trim();
        drawRows();
      });
      container.querySelector("#admin-upload").addEventListener("click", function (event) {
        openUploadDrawer(event.currentTarget);
      });
      container.querySelectorAll("[data-status-filter]").forEach(function (button) {
        button.addEventListener("click", function () {
          currentStatus = button.dataset.statusFilter;
          container.querySelectorAll("[data-status-filter]").forEach(function (item) {
            var selected = item.dataset.statusFilter === currentStatus;
            item.classList.toggle("active", selected);
            item.setAttribute("aria-pressed", String(selected));
          });
          drawRows();
        });
      });
      var tbody = container.querySelector("#admin-skill-rows");
      tbody.addEventListener("click", onTableAction);
      drawRows();
      UI.refreshIcons(container);
      if (focusSkillId) focusAfterRender(focusSkillId, "#admin-title");
    }

    function statusFilterTab(value, label) {
      var selected = currentStatus === value;
      return '<button class="tab' + (selected ? " active" : "") +
        '" type="button" data-status-filter="' + value +
        '" aria-pressed="' + selected + '">' + label + '</button>';
    }

    function drawRows() {
      var state = S.loadState();
      var needle = currentQuery.toLowerCase();
      var skills = state.skills.filter(function (skill) {
        if (skill.origin !== "default") return false;
        if (currentStatus !== "all" && skill.status !== currentStatus) return false;
        if (!needle) return true;
        return [skill.displayName, skill.internalName, skill.purpose].some(function (value) {
          return (value || "").toLowerCase().indexOf(needle) !== -1;
        });
      }).sort(function (left, right) {
        return right.updatedAt.localeCompare(left.updatedAt);
      });
      var tbody = container.querySelector("#admin-skill-rows");
      container.querySelector("#admin-result-count").textContent = "共 " + skills.length + " 个";
      tbody.innerHTML = skills.length
        ? skills.map(renderSkillRow).join("")
        : '<tr><td colspan="6"><div class="admin-empty">' +
            UI.icon("inbox") + '<strong>没有匹配的默认 Skill</strong>' +
            '<span>可调整启用状态或搜索关键词。</span></div></td></tr>';
      UI.refreshIcons(tbody);
    }

    function renderSkillRow(skill) {
      return '<tr>' +
        '<td><strong class="admin-skill-name" title="' + S.escapeHtml(skill.displayName) + '">' +
          S.escapeHtml(skill.displayName) + '</strong>' +
          (skill.status === "inactive" ? '<span class="badge badge-inactive">已停用</span>' : "") +
          '<code class="admin-internal-name" title="' + S.escapeHtml(skill.internalName) + '">' +
            S.escapeHtml(skill.internalName) + '</code></td>' +
        '<td><span class="admin-purpose" title="' + S.escapeHtml(skill.purpose || "未填写") + '">' +
          S.escapeHtml(skill.purpose || "未填写") + '</span></td>' +
        '<td><button class="admin-version-link" type="button" data-row-action="versions" data-id="' +
          S.escapeHtml(skill.id) + '" aria-label="查看「' + S.escapeHtml(skill.displayName) +
          '」版本记录">v' + S.escapeHtml(skill.version) + '</button></td>' +
        '<td><span class="admin-scope" title="' + S.escapeHtml(S.assignmentSummary(skill)) + '">' +
          S.escapeHtml(S.assignmentSummary(skill)) + '</span></td>' +
        '<td><time datetime="' + S.escapeHtml(skill.updatedAt) + '">' +
          S.escapeHtml(skill.updatedAt) + '</time></td>' +
        '<td class="admin-action-cell"><div class="admin-row-actions">' +
          '<button class="admin-inline-action" type="button" data-row-action="edit" data-id="' +
            S.escapeHtml(skill.id) + '">编辑</button>' +
          '<button class="admin-inline-action admin-state-action" type="button" data-row-action="' +
            (skill.status === "active" ? "deactivate" : "activate") + '" data-id="' +
            S.escapeHtml(skill.id) + '">' +
            (skill.status === "active" ? "停用" : "重新启用") + '</button>' +
        '</div></td>' +
      '</tr>';
    }

    function focusAfterRender(skillId, headingSelector) {
      var trigger = Array.prototype.find.call(
        container.querySelectorAll(".admin-state-action"),
        function (button) { return button.dataset.id === skillId; }
      );
      var target = trigger || container.querySelector(headingSelector);
      if (target) target.focus();
    }

    function actionLabel(skill, action) {
      return ACTION_LABELS[action];
    }

    function onTableAction(event) {
      var actionTrigger = event.target.closest("[data-row-action]");
      if (!actionTrigger) return;
      runAction(actionTrigger.dataset.id, actionTrigger.dataset.rowAction, actionTrigger);
    }

    function runAction(skillId, action, trigger) {
      if (action === "edit") openEditDrawer(skillId, trigger);
      else if (action === "replace") openReplaceDrawer(skillId, trigger);
      else if (action === "versions") openVersionsDrawer(skillId, trigger);
      else confirmTransition(skillId, action, trigger);
    }

    function confirmTransition(skillId, action, trigger) {
      var skill = S.getSkill(skillId);
      var copy = TRANSITION_COPY[action];
      if (!skill || !copy) return;
      var label = actionLabel(skill, action);
      if (action === "activate" && S.assignmentSummary(skill) === "未配置") {
        UI.toast("请先配置至少一种分配范围。", "danger");
        openEditDrawer(skillId, trigger);
        return;
      }
      UI.confirm({
        title: label + "「" + skill.displayName + "」？",
        message: "确认后状态将变为“" + copy.result + "”。" + copy.message,
        confirmText: "确认" + label,
        trigger: trigger,
        onConfirm: function () {
          var changed = S.transitionDefault(skillId, action);
          if (!changed) {
            UI.toast("操作失败，Skill 状态可能已变化。", "danger");
            renderSkills(skillId);
            return;
          }
          UI.toast(copy.toast);
          renderSkills(skillId);
        }
      });
    }

    function openEditDrawer(skillId, trigger) {
      var skill = S.getSkill(skillId);
      if (!skill) return;
      var content =
        '<p class="drawer-intro">修改展示信息和分配范围；内容与版本在下方集中管理。</p>' +
        '<div class="field"><label for="edit-default-name">展示名称</label>' +
          '<input id="edit-default-name" value="' + S.escapeHtml(skill.displayName) + '"></div>' +
        '<div class="field"><label for="edit-default-purpose">作用</label>' +
          '<textarea id="edit-default-purpose">' + S.escapeHtml(skill.purpose || "") + '</textarea></div>' +
        '<section class="edit-content-section" aria-labelledby="edit-content-title">' +
          '<div><strong id="edit-content-title">内容与版本</strong>' +
            '<span class="hint">当前版本 v' + S.escapeHtml(skill.version) + '</span></div>' +
          '<div class="edit-content-actions">' +
            '<button class="btn btn-outline btn-sm" type="button" data-edit-action="versions">查看版本</button>' +
            '<button class="btn btn-outline btn-sm" type="button" data-edit-action="replace">更新内容</button>' +
          '</div>' +
        '</section>' +
        '<fieldset class="assignment-fieldset"><legend>分配范围</legend>' +
          assignmentEditor(skill) + '</fieldset>' +
        '<p class="field-error" id="edit-default-error" role="alert"></p>' +
        '<div class="dialog-actions"><button class="btn btn-ghost" type="button" data-action="cancel">取消</button>' +
          '<button class="btn btn-primary" type="button" data-action="save">保存配置</button></div>';
      var drawer = UI.openDrawer({
        title: "编辑配置",
        contentHtml: content,
        ariaLabel: "编辑默认 Skill 配置",
        trigger: trigger
      });
      bindAssignment(drawer);
      drawer.querySelector('[data-edit-action="versions"]').addEventListener("click", function () {
        UI.closeDialog();
        openVersionsDrawer(skillId, trigger);
      });
      drawer.querySelector('[data-edit-action="replace"]').addEventListener("click", function () {
        UI.closeDialog();
        openReplaceDrawer(skillId, trigger);
      });
      drawer.querySelector("[data-action=save]").addEventListener("click", function () {
        var displayName = drawer.querySelector("#edit-default-name").value.trim();
        var purpose = drawer.querySelector("#edit-default-purpose").value.trim();
        var assignment = readAssignment(drawer);
        if (!displayName || !purpose) {
          showError(drawer.querySelector("#edit-default-error"), "请填写展示名称和作用。");
          return;
        }
        if (!assignment.all && !assignment.depts.length && !assignment.people.length) {
          showError(drawer.querySelector("#edit-default-error"), "请至少选择一种分配范围。");
          return;
        }
        var saved = S.updateDefault(skillId, {
          displayName: displayName,
          purpose: purpose,
          assignAll: assignment.all,
          assignDepts: assignment.depts,
          assignPeople: assignment.people
        }, "修改配置");
        if (!saved) {
          showError(drawer.querySelector("#edit-default-error"), "保存失败，请刷新后重试。");
          return;
        }
        UI.closeDialog();
        UI.toast("配置已保存。");
        renderSkills(skillId);
      });
    }

    function blankWizard() {
      return {
        step: 1,
        source: "zip",
        repository: "HiTouchAI/hitouch-skills",
        skillPath: "skills/hk-tax-advisor",
        commit: "8f4a9c2",
        fileName: "",
        validZip: false,
        internalName: "",
        description: "",
        displayName: "",
        purpose: "",
        assignAll: true,
        assignDepts: [],
        assignPeople: [],
        error: ""
      };
    }

    function openUploadDrawer(trigger) {
      var wizard = blankWizard();
      var drawer = UI.openDrawer({
        contentHtml: '<div class="upload-wizard" data-wizard-root></div>',
        ariaLabel: "上传默认 Skill",
        trigger: trigger
      });
      renderWizard(drawer, wizard);
    }

    function renderWizard(drawer, wizard) {
      var root = drawer.querySelector("[data-wizard-root]");
      root.innerHTML =
        '<header class="wizard-header"><div><h2>导入默认 Skill</h2>' +
          '<p class="muted">从公司固定仓库导入，或上传包含 SKILL.md 的 ZIP 包。</p></div>' +
          '<button class="icon-button" type="button" data-action="close" aria-label="关闭上传向导">' +
            UI.icon("x") + '<span class="tooltip" role="tooltip">关闭</span></button></header>' +
        '<ol class="wizard-steps" aria-label="导入步骤">' +
          wizardStep('data-step="1"', 1, "选择来源", wizard.step) +
          wizardStep('data-step="2"', 2, "展示信息", wizard.step) +
          wizardStep('data-step="3"', 3, "分配范围", wizard.step) +
        '</ol>' +
        '<div class="wizard-body">' + wizardPanel(wizard) + '</div>' +
        '<p class="field-error wizard-error" role="alert">' + S.escapeHtml(wizard.error) + '</p>' +
        wizardActions(wizard);

      bindWizard(drawer, wizard);
      UI.refreshIcons(root);
    }

    function wizardStep(attribute, step, label, current) {
      return "<li " + attribute + ' class="' +
        (step === current ? "active" : (step < current ? "complete" : "")) + '"' +
        (step === current ? ' aria-current="step"' : "") + '>' +
        '<span>' + step + '</span><strong>' + label + '</strong></li>';
    }

    function wizardPanel(wizard) {
      if (wizard.step === 1) {
        var gitSelected = wizard.source === "git";
        return '<section aria-labelledby="wizard-step-title"><h3 id="wizard-step-title">1. 选择来源</h3>' +
          '<div class="source-choice" role="radiogroup" aria-label="Skill 内容来源">' +
            '<label class="check-row"><input type="radio" name="source" value="git"' + (gitSelected ? " checked" : "") + '> <span><strong>从 Git 导入</strong><small>仅 HiTouchAI/hitouch-skills</small></span></label>' +
            '<label class="check-row"><input type="radio" name="source" value="zip"' + (!gitSelected ? " checked" : "") + '> <span><strong>上传 ZIP</strong><small>自动备份至公司仓库</small></span></label></div>' +
          (gitSelected
            ? '<div class="field"><label>固定仓库</label><input value="HiTouchAI/hitouch-skills" disabled></div>' +
              '<div class="field"><label for="wizard-path">搜索 Skill</label><input id="wizard-path" type="search" list="wizard-skill-paths" value="' + S.escapeHtml(wizard.skillPath) + '" placeholder="输入名称或目录搜索，例如 dws"><datalist id="wizard-skill-paths"><option value="skills/hk-tax-advisor">香港税务顾问</option><option value="skills/dws">钉钉办公助手</option><option value="skills/bookkeeping">代理记账报价助手</option></datalist><p class="hint">输入关键词搜索并选择仓库中的 Skill 目录。</p></div>' +
              '<div class="field"><label for="wizard-commit">选择版本</label><select id="wizard-commit"><option value="8f4a9c2">最新可导入版本 · 2026-07-26</option><option value="4d21b7e">历史版本 · 2026-07-23</option></select><p class="hint">Git Commit：' + S.escapeHtml(wizard.commit) + '</p></div>' +
              '<p class="hint">导入固定版本快照，不执行仓库代码；同一版本与目录不可重复导入。</p>'
            : '<label class="drop-zone upload-drop-zone" for="wizard-file">' +
                UI.icon("file-archive", 'class="drop-icon"') +
                '<strong>选择 ZIP 文件</strong><span>文件内需要包含有效的 SKILL.md</span>' +
                '<input class="sr-only" id="wizard-file" type="file" accept=".zip"></label>') +
          (wizard.fileName ? '<p class="selected-file ' +
            (wizard.validZip ? "valid-file" : "invalid-file") + '">' +
            UI.icon(wizard.validZip ? "file-check-2" : "file-x") +
            '<span>' + S.escapeHtml(wizard.fileName) + '</span></p>' : "") +
        '</section>';
      }
      if (wizard.step === 2) {
        return '<section aria-labelledby="wizard-step-title"><h3 id="wizard-step-title">2. 展示信息</h3>' +
          '<div class="field"><label for="wizard-name">展示名称 <span class="required">*</span></label>' +
            '<input id="wizard-name" value="' + S.escapeHtml(wizard.displayName) + '"></div>' +
          '<div class="field"><label for="wizard-purpose">作用 <span class="required">*</span></label>' +
            '<textarea id="wizard-purpose">' + S.escapeHtml(wizard.purpose) + '</textarea></div>' +
        '</section>';
      }
      return '<section aria-labelledby="wizard-step-title"><h3 id="wizard-step-title">3. 分配范围</h3>' +
        '<p class="hint assignment-hint">默认对全员开放；仅在有需要时改为部门或指定人员。</p>' +
        '<fieldset class="assignment-fieldset"><legend class="sr-only">分配范围</legend>' +
          assignmentEditorRaw({
            all: wizard.assignAll,
            depts: wizard.assignDepts,
            people: wizard.assignPeople
          }) + '</fieldset></section>';
    }

    function wizardActions(wizard) {
      if (wizard.step < 3) {
        return '<div class="dialog-actions wizard-actions">' +
          (wizard.step > 1 ? '<button class="btn btn-ghost" type="button" data-wizard-action="previous">上一步</button>' : "") +
          '<button class="btn btn-primary" type="button" data-wizard-action="next"' +
            (wizard.step === 1 && !wizard.validZip ? " disabled" : "") + '>下一步' +
            UI.icon("arrow-right") + '</button></div>';
      }
      return '<div class="dialog-actions wizard-actions">' +
        '<button class="btn btn-ghost" type="button" data-wizard-action="previous">上一步</button>' +
        '<button class="btn btn-primary" type="button" data-wizard-action="submit"' +
          (canSubmitUpload(wizard) ? "" : " disabled") + '>' +
          uploadConfirmLabel(wizard) + '</button></div>';
    }

    function bindWizard(drawer, wizard) {
      var file = drawer.querySelector("#wizard-file");
      if (file) {
        file.addEventListener("change", function () {
          validateZip(file.files && file.files[0] ? file.files[0].name : "", wizard);
          renderWizard(drawer, wizard);
        });
      }
      drawer.querySelectorAll('input[name="source"]').forEach(function (input) {
        input.addEventListener("change", function () {
          wizard.source = input.value;
          wizard.error = "";
          if (wizard.source === "git") validateGit(wizard);
          else { wizard.fileName = ""; wizard.validZip = false; }
          renderWizard(drawer, wizard);
        });
      });
      var path = drawer.querySelector("#wizard-path");
      var commit = drawer.querySelector("#wizard-commit");
      if (commit) commit.value = wizard.commit;
      [path, commit].filter(Boolean).forEach(function (field) { field.addEventListener("change", function () {
        wizard.skillPath = path.value; wizard.commit = commit.value; validateGit(wizard); renderWizard(drawer, wizard);
      }); });
      if (path) path.addEventListener("input", function () {
        wizard.skillPath = path.value.trim();
        wizard.validZip = Boolean(wizard.skillPath && wizard.commit);
      });
      bindAssignment(drawer, function () {
        captureWizardFields(drawer, wizard);
        syncWizardActions(drawer, wizard);
      });
      drawer.querySelectorAll("[data-wizard-action]").forEach(function (button) {
        button.addEventListener("click", function () {
          captureWizardFields(drawer, wizard);
          wizard.error = "";
          var action = button.dataset.wizardAction;
          if (action === "previous") wizard.step -= 1;
          else if (action === "next") {
            if (wizard.step === 1 && !wizard.validZip) wizard.error = wizard.source === "git" ? "请选择可导入的 Git 目录和 Commit。" : "请先选择有效的 ZIP 文件。";
            else if (wizard.step === 2 && (!wizard.displayName || !wizard.purpose)) {
              wizard.error = "请填写展示名称和作用。";
            } else wizard.step += 1;
          } else if (action === "submit") {
            submitUpload(drawer, wizard);
            return;
          }
          renderWizard(drawer, wizard);
        });
      });
    }

    function validateZip(fileName, wizard) {
      wizard.source = "zip";
      wizard.fileName = fileName;
      wizard.validZip = false;
      wizard.internalName = "";
      wizard.description = "";
      if (!/\.zip$/i.test(fileName)) {
        wizard.error = "仅支持 ZIP 文件";
        return;
      }
      if (/invalid/i.test(fileName)) {
        wizard.error = "未找到有效的 SKILL.md";
        return;
      }
      var baseName = fileName.replace(/\.zip$/i, "");
      wizard.validZip = true;
      wizard.internalName = baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "uploaded-skill";
      wizard.description = "从 " + fileName + " 的 SKILL.md 解析出的 Skill。";
      wizard.displayName = wizard.displayName || baseName.replace(/[-_]+/g, " ");
      wizard.error = "";
    }

    function validateGit(wizard) {
      wizard.fileName = "git:" + wizard.repository + "/" + wizard.skillPath + "@" + wizard.commit;
      wizard.validZip = Boolean(wizard.skillPath && wizard.commit);
      wizard.internalName = wizard.skillPath.split("/").pop();
      wizard.description = "从 " + wizard.repository + " 的 " + wizard.skillPath + " 目录快照解析出的 Skill。";
      wizard.displayName = wizard.displayName || wizard.internalName.replace(/[-_]+/g, " ");
    }

    function captureWizardFields(root, wizard) {
      var name = root.querySelector("#wizard-name");
      var purpose = root.querySelector("#wizard-purpose");
      var path = root.querySelector("#wizard-path");
      var commit = root.querySelector("#wizard-commit");
      if (name) wizard.displayName = name.value.trim();
      if (purpose) wizard.purpose = purpose.value.trim();
      if (path) wizard.skillPath = path.value.trim();
      if (commit) wizard.commit = commit.value;
      if (path && wizard.source === "git") validateGit(wizard);
      if (root.querySelector("#scope-all")) {
        var assignment = readAssignment(root);
        wizard.assignAll = assignment.all;
        wizard.assignDepts = assignment.depts;
        wizard.assignPeople = assignment.people;
      }
    }

    function canSubmitUpload(wizard) {
      return wizard.validZip && (wizard.source === "git" || /\.zip$/i.test(wizard.fileName)) &&
        Boolean(wizard.internalName.trim()) && Boolean(wizard.description.trim()) &&
        Boolean(wizard.displayName.trim()) && Boolean(wizard.purpose.trim()) &&
        (wizard.assignAll || wizard.assignDepts.length > 0 || wizard.assignPeople.length > 0);
    }

    function uploadConfirmLabel(wizard) {
      var verb = wizard.source === "git" ? "导入" : "上传";
      return "确认" + verb + (wizard.assignAll ? "并对全员开放" : "并开放给指定范围");
    }

    function syncWizardActions(root, wizard) {
      var submit = root.querySelector('[data-wizard-action="submit"]');
      if (submit) {
        submit.disabled = !canSubmitUpload(wizard);
        submit.textContent = uploadConfirmLabel(wizard);
      }
    }

    function submitUpload(drawer, wizard) {
      if (!canSubmitUpload(wizard)) {
        wizard.error = "请完成内容校验、展示信息和至少一种分配范围。";
        renderWizard(drawer, wizard);
        return;
      }
      var uploaded = S.uploadSkill({
        fileName: wizard.fileName,
        validZip: wizard.validZip,
        source: wizard.source,
        repository: wizard.repository,
        skillPath: wizard.skillPath,
        commit: wizard.commit,
        internalName: wizard.internalName,
        description: wizard.description,
        displayName: wizard.displayName,
        purpose: wizard.purpose,
        assignAll: wizard.assignAll,
        assignDepts: wizard.assignDepts,
        assignPeople: wizard.assignPeople
      });
      if (!uploaded) {
        wizard.error = "保存失败，请检查填写内容后重试。";
        renderWizard(drawer, wizard);
        return;
      }
      UI.closeDialog();
      UI.toast(wizard.assignAll
        ? "Skill 已导入并对全员开放。"
        : "Skill 已导入并开放给指定范围。");
      renderSkills(uploaded.id);
    }

    function openReplaceDrawer(skillId, trigger) {
      var skill = S.getSkill(skillId);
      if (!skill) return;
      var replacement = {
        step: 1,
        fileName: "",
        validZip: false,
        internalName: "",
        description: "",
        error: ""
      };
      var drawer = UI.openDrawer({
        contentHtml: '<div class="replace-wizard" data-replace-root></div>',
        ariaLabel: "更新 Skill 内容",
        trigger: trigger
      });
      renderReplacement(drawer, replacement);

      function renderReplacement(layer, state) {
        var root = layer.querySelector("[data-replace-root]");
        root.innerHTML =
          '<header class="wizard-header"><div><h2>更新内容</h2><p class="muted">' +
            S.escapeHtml(skill.displayName) + ' · 当前 v' + S.escapeHtml(skill.version) + '</p></div>' +
            '<button class="icon-button" type="button" data-action="close" aria-label="关闭更新内容">' +
              UI.icon("x") + '<span class="tooltip" role="tooltip">关闭</span></button></header>' +
          '<ol class="wizard-steps compact" aria-label="更新内容步骤">' +
            wizardStep('data-step="1"', 1, "上传 ZIP", state.step) +
            wizardStep('data-step="2"', 2, "校验并更新", state.step) + '</ol>' +
          '<div class="wizard-body">' +
            (state.step === 1
              ? '<section><h3>1. 上传 ZIP</h3><label class="drop-zone upload-drop-zone" for="replace-file">' +
                  UI.icon("file-archive", 'class="drop-icon"') + '<strong>选择新版 ZIP</strong>' +
                  '<span>文件内需要包含有效的 SKILL.md</span>' +
                  '<input class="sr-only" id="replace-file" type="file" accept=".zip"></label></section>'
              : '<section><h3>2. 校验并更新</h3><div class="validation-success">' +
                  UI.icon("circle-check") + '<div><strong>ZIP 校验通过</strong><p>' +
                  S.escapeHtml(state.internalName) + '</p></div></div>' +
                  '<div class="field"><label for="replace-note">更新说明 <span class="required">*</span></label>' +
                  '<textarea id="replace-note" placeholder="说明本次版本的主要变化"></textarea></div></section>') +
          '</div><p class="field-error wizard-error" role="alert">' + S.escapeHtml(state.error) + '</p>' +
          '<div class="dialog-actions wizard-actions">' +
            (state.step === 2 ? '<button class="btn btn-ghost" type="button" data-replace-action="previous">上一步</button>' : "") +
            '<button class="btn btn-primary" type="button" data-replace-action="' +
              (state.step === 1 ? "next" : "save") + '"' +
              (state.step === 1 && !state.validZip ? " disabled" : "") + '>' +
              (state.step === 1 ? "下一步" : "确认更新") + '</button></div>';
        var file = root.querySelector("#replace-file");
        if (file) {
          file.addEventListener("change", function () {
            validateZip(file.files && file.files[0] ? file.files[0].name : "", state);
            renderReplacement(layer, state);
          });
        }
        root.querySelectorAll("[data-replace-action]").forEach(function (button) {
          button.addEventListener("click", function () {
            if (button.dataset.replaceAction === "previous") {
              state.step = 1;
            } else if (button.dataset.replaceAction === "next") {
              if (state.validZip) state.step = 2;
            } else {
              var note = root.querySelector("#replace-note").value.trim();
              if (!note) {
                state.error = "请填写更新说明。";
                renderReplacement(layer, state);
                return;
              }
              var replaced = S.uploadSkill({
                replaceId: skillId,
                fileName: state.fileName,
                validZip: state.validZip,
                internalName: state.internalName,
                description: state.description,
                updateNote: note
              });
              if (!replaced) {
                state.error = "更新失败，请刷新后重试。";
                renderReplacement(layer, state);
                return;
              }
              UI.closeDialog();
              UI.toast("ZIP 校验通过，已更新至 v" + replaced.version + "。");
              renderSkills(skillId);
              return;
            }
            state.error = "";
            renderReplacement(layer, state);
          });
        });
        UI.refreshIcons(root);
      }
    }

    function openVersionsDrawer(skillId, trigger) {
      var skill = S.getSkill(skillId);
      if (!skill) return;
      var versions = (skill.versions || []).map(function (version) {
        return '<tr><td><strong>v' + S.escapeHtml(version.ver) + '</strong>' +
            (version.current ? '<span class="badge badge-active">当前</span>' : "") + '</td>' +
          '<td>' + S.escapeHtml(version.time) + '</td>' +
          '<td><strong>' + S.escapeHtml(version.source === "git" ? (version.repository + " · " + version.skillPath) : version.zipFile) + '</strong><code>' +
            S.escapeHtml(version.checksum) + '</code></td>' +
          '<td><code>' + S.escapeHtml(version.gitCommit) + '</code></td>' +
          '<td>' + S.escapeHtml(version.note) + '</td></tr>';
      }).join("");
      UI.openDrawer({
        title: "版本记录（只读）",
        ariaLabel: skill.displayName + "的版本记录",
        trigger: trigger,
        contentHtml: '<p class="drawer-intro">' + S.escapeHtml(skill.displayName) +
          ' · 当前版本 v' + S.escapeHtml(skill.version) + '</p>' +
          '<div class="table-wrap version-table"><table><thead><tr><th>版本</th><th>时间</th>' +
          '<th>ZIP / 校验</th><th>Git commit</th><th>更新说明</th></tr></thead><tbody>' +
            versions + '</tbody></table></div>' +
          '<div class="dialog-actions"><button class="btn btn-primary" type="button" data-action="close">关闭</button></div>'
      });
    }

    function assignmentEditor(skill) {
      return assignmentEditorRaw({
        all: skill.assignAll === true,
        depts: skill.assignDepts || [],
        people: skill.assignPeople || []
      });
    }

    function assignmentEditorRaw(assignment) {
      var allSelected = assignment.all === true;
      return '<div class="assignment-mode" role="radiogroup" aria-label="范围模式">' +
          '<label class="check-row assignment-mode-option">' +
            '<input type="radio" id="scope-all" name="scope-mode" value="all"' +
              (allSelected ? " checked" : "") + '>' +
            '<span><strong>全员</strong><small>覆盖全部有效内部用户</small></span>' +
          '</label>' +
          '<label class="check-row assignment-mode-option">' +
            '<input type="radio" id="scope-custom" name="scope-mode" value="custom"' +
              (allSelected ? "" : " checked") + '>' +
            '<span><strong>指定范围</strong><small>按部门和人员开放</small></span>' +
          '</label>' +
        '</div>' +
        '<div class="assignment-custom" data-custom-scope' + (allSelected ? " hidden" : "") + '>' +
          '<p class="hint assignment-hint">部门和指定人员可以同时选择，最终范围取并集。</p>' +
          '<span class="assignment-label">部门</span><div class="chip-row">' +
            S.DEPTS.map(function (department) {
              var selected = assignment.depts.indexOf(department.id) !== -1;
              return '<button class="chip' + (selected ? " selected" : "") +
                '" type="button" data-chip-dept="' +
                S.escapeHtml(department.id) + '" aria-pressed="' + selected + '"' +
                (selected ? ' data-selected="true"' : "") + '>' +
                S.escapeHtml(department.name) + '</button>';
            }).join("") + '</div>' +
          '<span class="assignment-label">指定人员</span>' +
          '<div class="person-search">' +
            '<label class="sr-only" for="scope-person-search">搜索指定人员</label>' +
            UI.icon("search", 'class="search-icon"') +
            '<input id="scope-person-search" type="search" placeholder="搜索人员姓名" autocomplete="off">' +
          '</div>' +
          '<div class="chip-row person-options" data-person-options>' +
            S.PEOPLE.map(function (person) {
              var selected = assignment.people.indexOf(person.personId) !== -1;
              var department = S.DEPTS.find(function (item) { return item.id === person.deptId; });
              return '<button class="chip person-option' + (selected ? " selected" : "") +
                '" type="button" data-chip-person="' +
                S.escapeHtml(person.personId) + '" data-person-name="' +
                S.escapeHtml(person.name.toLowerCase()) + '" aria-pressed="' + selected + '"' +
                (selected ? ' data-selected="true"' : "") + '>' +
                '<span>' + S.escapeHtml(person.name) + '</span>' +
                '<small>' + S.escapeHtml(department ? department.name : "部门未配置") + '</small>' +
              '</button>';
            }).join("") +
          '</div>' +
          '<p class="person-empty hint" data-person-empty hidden>没有匹配的人员</p>' +
        '</div>';
    }

    function bindAssignment(root, onChange) {
      var all = root.querySelector("#scope-all");
      var custom = root.querySelector("#scope-custom");
      var customPanel = root.querySelector("[data-custom-scope]");

      function syncScopeMode() {
        if (customPanel) customPanel.hidden = !custom.checked;
      }

      [all, custom].filter(Boolean).forEach(function (input) {
        input.addEventListener("change", function () {
          syncScopeMode();
          if (onChange) onChange();
        });
      });
      syncScopeMode();

      root.querySelectorAll(".chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          var selected = !chip.classList.contains("selected");
          chip.classList.toggle("selected", selected);
          if (selected) chip.dataset.selected = "true";
          else delete chip.dataset.selected;
          chip.setAttribute("aria-pressed", String(selected));
          if (onChange) onChange();
        });
      });

      var personSearch = root.querySelector("#scope-person-search");
      if (personSearch) {
        personSearch.addEventListener("input", function () {
          var query = personSearch.value.trim().toLowerCase();
          var visibleCount = 0;
          root.querySelectorAll("[data-chip-person]").forEach(function (chip) {
            var visible = !query || chip.dataset.personName.indexOf(query) !== -1;
            chip.hidden = !visible;
            if (visible) visibleCount += 1;
          });
          var empty = root.querySelector("[data-person-empty]");
          if (empty) empty.hidden = visibleCount !== 0;
        });
      }
    }

    function readAssignment(root) {
      var all = root.querySelector("#scope-all");
      if (all && all.checked) return { all: true, depts: [], people: [] };
      return {
        all: false,
        depts: Array.prototype.map.call(
          root.querySelectorAll(".chip[data-chip-dept].selected"),
          function (chip) { return chip.dataset.chipDept; }
        ),
        people: Array.prototype.map.call(
          root.querySelectorAll(".chip[data-chip-person].selected"),
          function (chip) { return chip.dataset.chipPerson; }
        )
      };
    }

    function showError(element, message) {
      element.textContent = message;
      element.classList.add("visible");
    }

  }

  window.Admin = { mount: mount };
})();
