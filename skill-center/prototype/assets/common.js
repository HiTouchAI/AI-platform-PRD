/* Shared HiTouch/Hermes UI primitives. */
(function () {
  "use strict";

  var S = window.S || {};
  var activeLayer = null;

  function escapeHtml(value) {
    if (S.escapeHtml) return S.escapeHtml(value);
    return String(value == null ? "" : value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }

  function icon(name, attrs) {
    return '<i data-lucide="' + escapeHtml(name) + '" ' + (attrs || "") + ' aria-hidden="true"></i>';
  }

  function refreshIcons(root) {
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.8 }, root: root || document });
    }
  }

  function railItem(item, active) {
    var className = "rail-item icon-button" + (active ? " active" : "") + (item.disabled || !item.href ? " passive" : "");
    var label = escapeHtml(item.label);
    var current = active ? ' aria-current="page"' : "";
    var content = icon(item.icon, 'class="rail-icon"') + '<span class="tooltip rail-tip" role="tooltip">' + label + "</span>";
    if (item.disabled || !item.href) {
      return '<span class="' + className + '" aria-label="' + label + '" aria-disabled="true"' + current + ">" + content + "</span>";
    }
    return '<a class="' + className + '" href="' + escapeHtml(item.href) + '" aria-label="' + label + '"' + current + ">" + content + "</a>";
  }

  function mountShell(options) {
    options = options || {};
    var root = options.root || document.querySelector("[data-shell]") || document.body;
    var active = options.active || "chat";
    var showContext = options.showContext !== false;
    var contextItems = options.contextItems || [];
    var context = showContext ? contextItems.map(function (item) {
      var className = "context-item" + (item.active ? " active" : "") + (item.href ? "" : " passive");
      var label = escapeHtml(item.label || item.title || "");
      var current = item.active ? ' aria-current="page"' : "";
      var key = item.key ? ' data-context-key="' + escapeHtml(item.key) + '"' : "";
      if (!item.href) {
        return '<span class="' + className + '" aria-disabled="true"' + key + current + ">" + label + "</span>";
      }
      return '<a class="' + className + '" href="' + escapeHtml(item.href) + '"' + key + current + ">" + label + "</a>";
    }).join("") : "";
    var contextSidebar = showContext
      ? '<aside class="context-sidebar" aria-label="' + escapeHtml(options.contextTitle || "上下文") + '">' +
          '<h2 class="context-title">' + escapeHtml(options.contextTitle || "") + "</h2>" + context +
        "</aside>"
      : "";
    var workspace = options.showWorkspace === true
      ? '<aside class="workspace-panel" aria-label="Workspace">' + (options.workspaceHtml || "") + "</aside>"
      : "";
    var railItems = [
      { key: "chat", label: "聊天", icon: "message-square", href: options.chatHref || "session.html" },
      { key: "calendar", label: "日历", icon: "calendar-days", href: options.calendarHref, disabled: options.calendarDisabled },
      { key: "skills", label: "Skill 中心", icon: "sparkles", href: options.skillsHref || "skill-center.html" },
      { key: "apps", label: "应用中心", icon: "grid-2x2", href: options.appsHref, disabled: options.appsDisabled }
    ];

    root.innerHTML =
      '<header class="app-topbar">' +
        '<a class="topbar-brand" href="' + escapeHtml(options.homeHref || "index.html") + '" aria-label="返回工作台">H</a>' +
        '<span class="topbar-title">' + escapeHtml(options.productName || "HiTouch") + "</span>" +
      "</header>" +
      '<div class="app-frame' + (showContext ? "" : " no-context") + (options.showWorkspace === true ? " has-workspace" : "") + '">' +
        '<nav class="global-rail" aria-label="HiTouch 主导航">' +
          railItems.map(function (item) { return railItem(item, item.key === active); }).join("") +
        "</nav>" +
        contextSidebar +
        '<main class="main-surface">' + (options.contentHtml || "") + "</main>" +
        workspace +
      "</div>";
    refreshIcons(root);
    return root;
  }

  function mountAppBar() {
    var el = document.querySelector("[data-appbar]");
    if (!el) return;
    el.innerHTML =
      '<header class="app-topbar appbar">' +
        '<div class="appbar-inner"><a class="brand-logo" href="index.html" aria-label="返回工作台">H</a>' +
        '<span class="brand-name">大旗财税AI</span><div class="user-avatar" aria-label="Rita">R</div></div>' +
      "</header>";
  }

  function isFocusableVisible(element) {
    for (var current = element; current; current = current.parentElement) {
      if (current.hidden || current.disabled || current.getAttribute("aria-hidden") === "true") return false;
      var style = window.getComputedStyle(current);
      if (style.display === "none" || style.visibility === "hidden") return false;
    }
    return true;
  }

  function getFocusable(layer) {
    return Array.prototype.slice.call(layer.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'
    )).filter(function (element) { return isFocusableVisible(element); });
  }

  function isConnectedElement(value) {
    return Boolean(value && value.nodeType === 1 &&
      value.isConnected === true && typeof value.focus === "function");
  }

  function closeLayer(layer) {
    layer = layer || activeLayer;
    if (!layer) return;
    if (layer.parentNode) layer.parentNode.removeChild(layer);
    if (activeLayer === layer) activeLayer = null;
    if (isConnectedElement(layer._returnFocus)) layer._returnFocus.focus();
    if (layer._onClose) layer._onClose();
  }

  function bindLayerControls(layer, panel) {
    layer.addEventListener("click", function (event) {
      if (event.target === layer && layer.dataset.submitting !== "true") closeLayer(layer);
    });
    layer.addEventListener("click", function (event) {
      if (event.target.closest("[data-action=cancel], [data-action=close]")) closeLayer(layer);
    });
    layer.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLayer(layer);
        return;
      }
      if (event.key !== "Tab") return;
      var focusable = getFocusable(panel);
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  function normalizeLayerOptions(options, wide) {
    if (typeof options === "string") return { contentHtml: options, wide: wide === true };
    return options || {};
  }

  function openLayer(type, options, wide) {
    options = normalizeLayerOptions(options, wide);
    closeLayer(activeLayer);
    var layer = document.createElement("div");
    var panelClass = type === "drawer" ? "drawer" : "dialog";
    layer.className = type === "drawer" ? "drawer-overlay" : "dialog-overlay";
    layer.dataset.submitting = options.submitting ? "true" : "false";
    layer._returnFocus = isConnectedElement(options.trigger)
      ? options.trigger
      : (isConnectedElement(document.activeElement) ? document.activeElement : null);
    layer._onClose = options.onClose;
    layer.innerHTML =
      '<section class="' + panelClass + (options.wide ? " wide" : "") + '" role="dialog" aria-modal="true" aria-label="' +
        escapeHtml(options.ariaLabel || options.title || (type === "drawer" ? "侧边面板" : "对话框")) + '" tabindex="-1">' +
        (options.title ? '<h2>' + escapeHtml(options.title) + "</h2>" : "") +
        (options.contentHtml || options.html || "") +
      "</section>";
    document.body.appendChild(layer);
    activeLayer = layer;
    var panel = layer.querySelector("." + panelClass);
    bindLayerControls(layer, panel);
    var focusable = getFocusable(panel);
    var firstField = focusable.filter(function (element) {
      return /^(INPUT|SELECT|TEXTAREA)$/.test(element.tagName) || element.getAttribute("contenteditable") === "true";
    })[0];
    (firstField || focusable[0] || panel).focus();
    refreshIcons(layer);
    return layer;
  }

  function openDialog(options, wide) {
    return openLayer("dialog", options, wide);
  }

  function openDrawer(options) {
    return openLayer("drawer", options);
  }

  function closeDialog() {
    closeLayer(activeLayer || document.querySelector(".dialog-overlay"));
  }

  function toast(message, tone) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var el = document.createElement("div");
    var resolvedTone = tone === true ? "danger" : (tone || "success");
    el.className = "toast " + resolvedTone;
    el.setAttribute("role", "status");
    el.textContent = message;
    document.body.appendChild(el);
    window.setTimeout(function () { if (el.parentNode) el.remove(); }, 3200);
    return el;
  }

  function confirm(options) {
    var destructive = options.danger === true;
    var content =
      '<p class="muted">' + escapeHtml(options.message) + "</p>" +
      '<div class="dialog-actions"><button class="btn btn-ghost" data-action="cancel">取消</button>' +
      '<button class="btn ' + (destructive ? "btn-danger" : "btn-primary") + '" data-action="confirm"' +
        (destructive ? ' data-destructive="true"' : "") + ">" + escapeHtml(options.confirmText || "确认") + "</button></div>";
    var overlay = openDialog({ title: options.title, contentHtml: content, trigger: options.trigger });
    overlay.querySelector("[data-action=confirm]").onclick = function () {
      closeLayer(overlay);
      if (options.onConfirm) options.onConfirm();
    };
    return overlay;
  }

  function useSkill(skillId, onAccessRevoked) {
    var skill = S.getSkill && S.getSkill(skillId);
    if (!skill || !S.isVisible(skillId)) {
      toast("该 Skill 已不可用。", "danger");
      if (onAccessRevoked) onAccessRevoked();
      return;
    }
    var content =
      '<p class="muted">将使用「' + escapeHtml(skill.displayName) + '」为你创建一段新对话。该能力由系统在后台配置，不会出现在你的消息中。</p>' +
      '<div class="field"><label for="use-input">你的需求 <span class="required">*</span></label>' +
      '<textarea id="use-input" placeholder="例如：请生成代理记账报价建议"></textarea><div class="field-error" id="use-error" role="alert">请先填写具体需求。</div></div>' +
      '<div class="dialog-actions"><button class="btn btn-ghost" data-action="cancel">取消</button><button class="btn btn-primary" data-action="submit">开始对话</button></div>';
    var overlay = openDialog({ title: "使用「" + skill.displayName + "」", contentHtml: content });
    var input = overlay.querySelector("#use-input");
    var error = overlay.querySelector("#use-error");
    var submit = overlay.querySelector("[data-action=submit]");
    var navigated = false;
    var accessRevoked = false;
    var cancelled = false;
    var onClose = overlay._onClose;
    overlay._onClose = function () {
      cancelled = true;
      if (onClose) onClose();
    };

    function showError(message, state) {
      overlay.dataset.state = state;
      error.textContent = message;
      error.style.display = "block";
      input.setAttribute("aria-invalid", "true");
    }

    function clearError() {
      overlay.dataset.state = "idle";
      error.style.display = "none";
      input.removeAttribute("aria-invalid");
    }

    function resetSubmission() {
      overlay.dataset.submitting = "false";
      submit.disabled = false;
      submit.removeAttribute("aria-busy");
      submit.textContent = "开始对话";
    }

    function revokeAccess() {
      if (accessRevoked) return;
      accessRevoked = true;
      closeLayer(overlay);
      toast("该 Skill 已不可用，列表已刷新。", "danger");
      if (onAccessRevoked) onAccessRevoked();
    }

    input.focus();
    input.addEventListener("input", function () {
      if (overlay.dataset.submitting !== "true") clearError();
    });
    submit.onclick = function () {
      if (overlay.dataset.submitting === "true" || navigated) return;
      var request = input.value;
      request = request.trim();
      if (!request) {
        showError("请先填写具体需求。", "validation-error");
        input.focus();
        return;
      }
      if (!S.isVisible(skillId)) {
        revokeAccess();
        return;
      }
      overlay.dataset.submitting = "true";
      overlay.dataset.state = "submitting";
      submit.disabled = true;
      submit.setAttribute("aria-busy", "true");
      submit.innerHTML = icon("loader-circle", 'class="spin"') + " 正在创建";
      refreshIcons(submit);
      window.setTimeout(function () {
        if (!overlay.isConnected || cancelled || navigated) return;
        var flow;
        try {
          flow = S.createFlow(skillId, request);
        } catch (_) {
          flow = null;
        }
        if (!overlay.isConnected || cancelled || navigated) return;
        if (!flow) {
          resetSubmission();
          if (!S.isVisible(skillId)) {
            revokeAccess();
          } else {
            showError("创建对话失败，请重试。", "create-failed");
          }
          return;
        }
        if (!overlay.isConnected || cancelled || navigated) return;
        navigated = true;
        location.href = S.buildUrl("session.html", { flow: flow.id, from: "skill-center" });
      }, 32);
    };
  }

  function editPersonal(skillId, onSaved) {
    var skill = S.getSkill && S.getSkill(skillId);
    if (!skill || skill.origin !== "personal") { toast("你没有编辑权限。", "danger"); return; }
    var content =
      '<p class="muted">仅修改展示名称和用途，不影响此 Skill 的使用。</p>' +
      '<div class="field"><label for="edit-name">展示名称 <span class="required">*</span></label><input id="edit-name" value="' + escapeHtml(skill.displayName) + '"></div>' +
      '<div class="field"><label for="edit-purpose">能帮你做什么 <span class="required">*</span></label><textarea id="edit-purpose">' + escapeHtml(skill.purpose || "") + "</textarea></div>" +
      '<div class="field-error" id="edit-error">请填写展示名称和作用。</div><div class="dialog-actions"><button class="btn btn-ghost" data-action="cancel">取消</button><button class="btn btn-primary" data-action="save">保存</button></div>';
    var overlay = openDialog({ title: "编辑展示信息", contentHtml: content });
    overlay.querySelector("[data-action=save]").onclick = function () {
      var name = overlay.querySelector("#edit-name").value.trim();
      var purpose = overlay.querySelector("#edit-purpose").value.trim();
      if (!name || !purpose) { overlay.querySelector("#edit-error").style.display = "block"; return; }
      if (!S.editPersonal(skillId, name, purpose)) {
        overlay.querySelector("#edit-error").textContent = "保存失败，请重试。";
        overlay.querySelector("#edit-error").style.display = "block";
        return;
      }
      closeLayer(overlay);
      toast("展示信息已更新。");
      if (onSaved) onSaved();
    };
  }

  function deletePersonal(skillId, onFinished) {
    var skill = S.getSkill && S.getSkill(skillId);
    if (!skill || skill.origin !== "personal") return;
    confirm({
      title: "删除「" + skill.displayName + "」？",
      message: "仅删除「" + skill.displayName + "」对应的 Skill 目录。删除后无法从 Skill 中心恢复。",
      confirmText: "确认删除",
      danger: true,
      onConfirm: function () {
        var deleted = false;
        try {
          deleted = S.deletePersonal(skillId);
        } catch (_) {}
        if (!deleted) {
          toast("删除失败，请刷新后重试。", "danger");
          if (onFinished) onFinished(false);
          return;
        }
        toast("Skill 已删除，新对话不再加载。");
        if (onFinished) onFinished(true);
      }
    });
  }

  window.UI = {
    icon: icon,
    refreshIcons: refreshIcons,
    mountShell: mountShell,
    mountAppBar: mountAppBar,
    toast: toast,
    closeDialog: closeDialog,
    openDialog: openDialog,
    openDrawer: openDrawer,
    confirm: confirm,
    useSkill: useSkill,
    editPersonal: editPersonal,
    deletePersonal: deletePersonal
  };
})();
