import { bindMockupControls } from "./mockup-controls.js";

export function bindEvents({
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
}) {
  /* ---------- actions ---------- */
  function act(a, el) {
    const id = el.dataset.id ? Number(el.dataset.id) : null;
    switch (a) {
      case "toggleDetails": {
        S.detailsOpen = !S.detailsOpen;
        el.setAttribute("aria-expanded", S.detailsOpen);
        const t = $("#tech");
        if (t) t.hidden = !S.detailsOpen;
        break;
      }
      case "startDownload":
        S.outcome = $("#outSel").value;
        runDownload(0);
        break;
      case "chooseModel":
        void chooseModel();
        break;
      case "cancelDownload":
        clearTimers();
        S.setup = "consent";
        S.progress = 0;
        render();
        toast("Download canceled. Nothing was installed.");
        break;
      case "retryDownload":
        S.outcome = "ok";
        syncSel();
        runDownload(0);
        break;
      case "redownload":
        S.outcome = "ok";
        syncSel();
        runDownload(0);
        break;
      case "startChat":
        if (invoke)
          void trackWrite(
            invoke("set_setup_complete", { complete: true }),
          ).catch(() => toast("Civra couldn't save setup status. Try again."));
        S.screen = "chat";
        S.cur = newDraft();
        S.notice = "ready";
        render();
        {
          const ta = $("#msg");
          if (ta) ta.focus();
        }
        break;
      case "newChat":
        newChat();
        break;
      case "openChat":
        openChat(id);
        break;
      case "goSettings":
        goSettings();
        break;
      case "backToChat":
        backToChat();
        break;
      case "openDrawer":
        setDrawer(true);
        break;
      case "closeDrawer":
        setDrawer(false);
        break;
      case "clearSearch":
        S.query = "";
        {
          const q = $("#q");
          q.value = "";
          q.focus();
        }
        el.hidden = true;
        refreshList();
        announce("Search cleared.");
        break;
      case "rename":
        renameDialog(id, el);
        break;
      case "del":
        deleteDialog(id, el);
        break;
      case "delAll":
        deleteAllDialog(el);
        break;
      case "mCancel":
        closeModal();
        break;
      case "mRename":
        saveRename();
        break;
      case "mDelete": {
        const c = S.chats.find((x) => x.id === getPending());
        if (c) {
          if (S.streaming && S.cur === c) stopStreaming(true);
          void removeStoredChat(c.id).catch(() =>
            toast("Civra couldn't delete this chat. Try again."),
          );
          S.chats = S.chats.filter((x) => x !== c);
          const wasCur = S.cur === c;
          if (wasCur) S.cur = newDraft();
          closeModal(true);
          if (wasCur && S.screen === "chat") render();
          else refreshList();
          refreshList();
          const f = $("#q");
          if (f) f.focus();
          toast("Chat deleted");
        }
        break;
      }
      case "mDeleteAll": {
        stopStreaming(true);
        void removeAllStoredChats().catch(() =>
          toast("Civra couldn't delete saved chats. Try again."),
        );
        S.chats = [];
        S.cur = newDraft();
        S.query = "";
        closeModal(true);
        render();
        const h = $("#main h1");
        if (h) h.focus();
        toast("All chats deleted");
        announce("All chats deleted.");
        break;
      }
      case "send":
        send();
        break;
      case "stop":
        stopStreaming();
        break;
      case "retry":
        retry();
        break;
      case "copy": {
        const m = S.cur.messages[Number(el.dataset.i)];
        copyText(m ? m.text : "").then((ok) =>
          toast(
            ok
              ? "Reply copied"
              : "Couldn't copy. Select the text and press Ctrl+C.",
          ),
        );
        break;
      }
      case "suggest":
        send(el.dataset.text);
        break;
      case "dismissNotice":
        S.notice = null;
        refreshNotice();
        break;
      case "tryGpu":
        setMode("gpu");
        {
          const r = $('input[name="mode"][value="gpu"]');
          if (r) r.checked = true;
        }
        break;
      case "checkModel": {
        const s = $("#modelCheck");
        s.textContent = "Checking…";
        if (invoke) {
          void invoke("verify_approved_model", {
            path: S.modelPath || "",
          })
            .then((result) => {
              if (s.isConnected)
                s.textContent = result.valid
                  ? "The approved model file is complete and unchanged."
                  : result.reason;
            })
            .catch((error) => {
              if (s.isConnected) s.textContent = String(error);
            });
          break;
        }
        setTimeout(() => {
          if (s.isConnected)
            s.innerHTML =
              '<span class="ok-txt">The model file is complete and unchanged.</span>';
        }, 1200);
        break;
      }
    }
  }
  win.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]");
    if (t && !t.disabled) act(t.dataset.act, t);
  });
  win.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "q") {
      S.query = t.value;
      refreshList();
      const c = $(".clear");
      if (c) c.hidden = !S.query;
      const n = S.query.trim()
        ? S.chats.filter((x) => {
            const q = S.query.trim().toLowerCase();
            return (
              x.title.toLowerCase().includes(q) ||
              x.messages.some((m) => m.text.toLowerCase().includes(q))
            );
          }).length
        : null;
      if (n !== null)
        announce(`${n} ${n === 1 ? "chat matches" : "chats match"}.`);
    }
    if (t.id === "msg") {
      t.style.height = "auto";
      t.style.height = Math.min(t.scrollHeight, 140) + "px";
      const b = $("#sendBtn");
      if (b) b.disabled = !t.value.trim();
    }
  });
  win.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "mode") setMode(t.value);
    if (t.name === "theme") {
      S.theme = t.value;
      applyTheme();
    }
  });
  win.addEventListener("keydown", (e) => {
    if (
      e.target.id === "msg" &&
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.isComposing
    ) {
      e.preventDefault();
      send();
    }
    if (e.target.id === "renameInput" && e.key === "Enter") {
      e.preventDefault();
      saveRename();
    }
  });
  document.addEventListener("keydown", (e) => {
    const ov = $("#overlay");
    if (e.key === "Escape") {
      if (ov) {
        e.preventDefault();
        closeModal();
        return;
      }
      if (S.drawer && S.screen !== "setup") {
        setDrawer(false);
        const b = $('[data-act="openDrawer"]');
        if (b) b.focus();
      }
    }
    if (ov && e.key === "Tab") {
      const f = [...ov.querySelectorAll("button,input")].filter(
        (x) => !x.disabled && !x.hidden,
      );
      if (!f.length) return;
      const first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if (
      (e.ctrlKey || e.metaKey) &&
      !e.shiftKey &&
      e.key.toLowerCase() === "n" &&
      S.screen !== "setup" &&
      !ov
    ) {
      e.preventDefault();
      newChat();
    }
  });

  if (!invoke)
    bindMockupControls({
      S,
      T,
      $,
      win,
      render,
      stopStreaming,
      clearTimers,
      closeModal,
      newDraft,
      sampleChats,
      toast,
      applyTheme,
      REPLIES,
      MEAL_Q,
      startReply,
      refreshThread,
      syncSel,
      refreshHead,
    });
}
