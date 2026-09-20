import {
  REPLIES,
  SUGGESTS,
  MEAL_Q,
  pickReply,
  sampleChats,
  newDraft,
  GROUPS,
  S,
  T,
} from "./state.js";
import { createViews } from "./views.js";
import { invoke, listen, createPersistence } from "./tauri-bridge.js";
import { createChatController } from "./chat-controller.js";
import { createSetupController } from "./setup-controller.js";
import { createDialogs } from "./dialogs.js";
import { bindEvents } from "./event-bindings.js";

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
const win = $("#win");

/* ---------- icons (always paired with a text label or tooltip) ---------- */
const P = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  sliders:
    '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  pencil:
    '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14 7 3 3"/>',
  trash:
    '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
  retry: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>',
  send: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.5h.01"/>',
  monitor:
    '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  folder:
    '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
};
const ic = (n, s = 18) =>
  `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${P[n]}</svg>`;
const mark = (s = 28) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--accent)"/><path d="M21.5 10.8A8 8 0 1 0 21.5 21.2" fill="none" stroke="var(--accent-ink)" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="16" r="2.2" fill="var(--accent-ink)"/></svg>`;

/* ---------- helpers ---------- */
function announce(m) {
  const l = $("#live");
  l.textContent = "";
  setTimeout(() => {
    l.textContent = m;
  }, 30);
}
function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.hidden = false;
  clearTimeout(T.toast);
  T.toast = setTimeout(() => {
    t.hidden = true;
  }, 2600);
}
function fmt(t) {
  return t
    .split(/\n\n+/)
    .map((p) => {
      const lines = p.split("\n");
      if (lines.every((l) => /^- /.test(l)))
        return (
          "<ul>" +
          lines.map((l) => `<li>${esc(l.slice(2))}</li>`).join("") +
          "</ul>"
        );
      return "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>";
    })
    .join("");
}
function hl(text, q) {
  if (!q) return esc(text);
  const re = new RegExp(
    "(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")",
    "ig",
  );
  return text
    .split(re)
    .map((p, i) => (i % 2 ? `<mark>${esc(p)}</mark>` : esc(p)))
    .join("");
}
function snippet(c, q) {
  const m = c.messages.find((x) => x.text.toLowerCase().includes(q));
  if (!m) return "";
  const i = m.text.toLowerCase().indexOf(q),
    a = Math.max(0, i - 30);
  return (
    (a > 0 ? "…" : "") +
    m.text.slice(a, i + q.length + 45).replace(/\s+/g, " ") +
    "…"
  );
}
const modeLabel = () =>
  S.mode === "gpu" ? "Graphics card (experimental)" : "Standard mode";
function clearTimers() {
  clearInterval(T.dl);
  clearInterval(T.ver);
  clearTimeout(T.gpu);
}
function syncSel() {
  $("#outSel").value = S.outcome;
  $("#netSel").value = S.online ? "on" : "off";
  $("#gpuSel").value = S.gpuSim;
  $("#sizeSel").value = S.size;
  $("#themeSel").value = S.theme;
}
function applyTheme() {
  const r = document.documentElement;
  if (S.theme === "system") r.removeAttribute("data-theme");
  else r.setAttribute("data-theme", S.theme);
  $("#themeSel").value = S.theme;
  const rd = $(`input[name="theme"][value="${S.theme}"]`);
  if (rd) rd.checked = true;
}

const {
  render,
  refreshList,
  refreshHead,
  refreshNotice,
  refreshThread,
  tickText,
  appendNativeText,
  gpuStatusHTML,
} = createViews({
  S,
  $,
  esc,
  ic,
  mark,
  fmt,
  hl,
  snippet,
  modeLabel,
  invoke,
  GROUPS,
  SUGGESTS,
  updateDL,
});

const {
  trackWrite,
  loadSavedChats,
  persistChat,
  removeStoredChat,
  removeAllStoredChats,
} = createPersistence({ S, newDraft, refreshHead, refreshList });

function updateDL() {
  const b = $("#dlBar");
  if (!b) return;
  const p = Math.round(S.progress);
  b.setAttribute("aria-valuenow", p);
  b.firstElementChild.style.width = p + "%";
  $("#dlTxt").innerHTML =
    `<strong>${p}%</strong> — ${((2.4 * S.progress) / 100).toFixed(1)} GB of 2.4 GB`;
  const m = Math.ceil((100 - S.progress) * 0.08);
  $("#dlEta").textContent =
    m <= 1 ? "Less than a minute left" : `About ${m} minutes left`;
}
const { runDownload, chooseModel } = createSetupController({
  S,
  T,
  $,
  clearTimers,
  render,
  updateDL,
  syncSel,
  announce,
  invoke,
});

const {
  startReply,
  stopStreaming,
  send,
  retry,
  nativeText,
  finishNativeReply,
} = createChatController({
  S,
  $,
  pickReply,
  persistChat,
  refreshThread,
  refreshHead,
  refreshList,
  announce,
  toast,
  invoke,
  tickText,
  appendNativeText,
});

async function copyText(t) {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const a = document.createElement("textarea");
      a.value = t;
      a.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(a);
      a.select();
      const ok = document.execCommand("copy");
      a.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function setMode(v) {
  clearTimeout(T.gpu);
  if (v === "cpu") {
    S.mode = "cpu";
    S.gpuState = null;
    const g = $("#gpuStatus");
    if (g) g.innerHTML = gpuStatusHTML();
    refreshHead();
    return;
  }
  S.gpuState = "checking";
  $("#gpuStatus").innerHTML = gpuStatusHTML();
  T.gpu = setTimeout(() => {
    if (S.screen !== "settings") return;
    if (S.gpuSim === "ok") {
      S.mode = "gpu";
      S.gpuState = "on";
    } else {
      S.mode = "cpu";
      S.gpuState = "failed";
      const r = $('input[name="mode"][value="cpu"]');
      if (r) r.checked = true;
    }
    $("#gpuStatus").innerHTML = gpuStatusHTML();
  }, 1400);
}

/* ---------- render / navigation ---------- */
function setDrawer(v) {
  S.drawer = v;
  $("#body").dataset.drawer = v ? "open" : "closed";
  if (v) {
    const q = $("#q");
    if (q) q.focus();
  }
}
function openChat(id) {
  const c = S.chats.find((x) => x.id === id);
  if (!c) return;
  stopStreaming(true);
  S.cur = c;
  S.screen = "chat";
  S.drawer = false;
  render();
  const ta = $("#msg");
  if (ta) ta.focus();
}
function newChat() {
  if (S.screen === "setup") return;
  stopStreaming(true);
  S.cur = newDraft();
  S.screen = "chat";
  S.drawer = false;
  render();
  const ta = $("#msg");
  if (ta) ta.focus();
}
function goSettings() {
  stopStreaming(true);
  S.screen = "settings";
  S.drawer = false;
  render();
  const h = $("#main h1");
  if (h) h.focus();
}
function backToChat() {
  S.screen = "chat";
  render();
  const ta = $("#msg");
  if (ta) ta.focus();
}

const {
  closeModal,
  renameDialog,
  saveRename,
  deleteDialog,
  deleteAllDialog,
  getPending,
} = createDialogs({
  S,
  $,
  win,
  esc,
  persistChat,
  toast,
  refreshList,
  refreshHead,
});

bindEvents({
  S,
  T,
  $,
  win,
  invoke,
  trackWrite,
  runDownload,
  chooseModel,
  clearTimers,
  render,
  toast,
  syncSel,
  newDraft,
  refreshList,
  announce,
  renameDialog,
  deleteDialog,
  deleteAllDialog,
  closeModal,
  saveRename,
  getPending,
  stopStreaming,
  removeStoredChat,
  removeAllStoredChats,
  send,
  retry,
  copyText,
  refreshNotice,
  setMode,
  setDrawer,
  openChat,
  newChat,
  goSettings,
  backToChat,
  refreshHead,
  applyTheme,
  REPLIES,
  MEAL_Q,
  sampleChats,
  startReply,
  refreshThread,
});

async function initialiseApp() {
  try {
    await loadSavedChats();
    if (listen) {
      await listen("inference-chunk", ({ payload }) => {
        const active = S.streaming;
        if (!active || active.requestId !== payload.requestId) return;
        active.batcher.push(nativeText(payload.chunk));
      });
      await listen("inference-finished", ({ payload }) => {
        finishNativeReply(payload.requestId, payload.error);
      });
    }
    if (S.modelPath) {
      S.screen = "setup";
      S.setup = "loading";
      render();
      await invoke("load_native_engine", {
        modelPath: S.modelPath,
        firstUse: false,
      });
      S.modelReady = true;
      S.screen = "chat";
    }
  } catch (error) {
    console.error("Could not start Civra", error);
    S.modelReady = false;
    S.setupError = String(error);
    S.screen = "setup";
    S.setup = "consent";
  }
  syncSel();
  applyTheme();
  render();
}
void initialiseApp();
